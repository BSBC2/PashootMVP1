import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const reportId = params.id;

    const report = await db.report.findUnique({
      where: {
        id: reportId,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Check authorization
    if (report.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Get report error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get report",
      },
      { status: 500 }
    );
  }
}
