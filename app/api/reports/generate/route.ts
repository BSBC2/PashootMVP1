import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { getReportDefinition } from "@/lib/reports/report-registry";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { reportType, startDate, endDate } = await request.json();

    // Validate inputs
    if (!reportType || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Report type, start date, and end date are required" },
        { status: 400 }
      );
    }

    // Get report definition
    const reportDef = getReportDefinition(reportType);
    if (!reportDef) {
      return NextResponse.json(
        { error: `Unknown report type: ${reportType}` },
        { status: 400 }
      );
    }

    // Create report record with "generating" status
    const report = await db.report.create({
      data: {
        userId: user.id,
        reportType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "generating",
      },
    });

    try {
      // Generate report data
      const reportData = await reportDef.generator({
        reportType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        userId: user.id,
      });

      // Render HTML
      const html = reportDef.renderer(reportData);

      // TODO: Generate PDF from HTML
      // For now, store HTML as base64 in pdfUrl field
      const htmlBase64 = Buffer.from(html).toString("base64");

      // Update report with generated content
      await db.report.update({
        where: { id: report.id },
        data: {
          status: "completed",
          pdfUrl: `data:text/html;base64,${htmlBase64}`,
          metadata: reportData,
        },
      });

      return NextResponse.json({
        success: true,
        reportId: report.id,
        message: "Report generated successfully",
      });
    } catch (error) {
      // Update report status to failed
      await db.report.update({
        where: { id: report.id },
        data: {
          status: "failed",
          metadata: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
      });

      throw error;
    }
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate report",
      },
      { status: 500 }
    );
  }
}
