import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateVendorStatement(
  request: ReportRequest
): Promise<ReportData> {
  const { userId, startDate, endDate } = request;

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      type: "expense",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Group by vendor
  const vendorStatements: Record<string, any[]> = {};

  transactions.forEach((t) => {
    const metadata = t.metadata as any;
    const vendor = metadata?.vendor || metadata?.vendorName || t.description.split(" - ")[0] || "Unknown Vendor";

    if (!vendorStatements[vendor]) {
      vendorStatements[vendor] = [];
    }

    vendorStatements[vendor].push({
      date: t.date.toISOString(),
      description: t.description,
      category: t.category || "Uncategorized",
      amount: parseFloat(t.amount.toString()),
      source: t.source,
    });
  });

  // Create statement for each vendor
  const statements = Object.entries(vendorStatements).map(([vendor, transactions]) => {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const count = transactions.length;

    return {
      vendor,
      transactions,
      totalExpenses: total,
      transactionCount: count,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
    };
  }).sort((a, b) => b.totalExpenses - a.totalExpenses);

  const totalExpenses = statements.reduce((sum, s) => sum + s.totalExpenses, 0);

  return {
    reportType: "Vendor Statement",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    statements,
    totalVendors: statements.length,
    totalExpenses,
  };
}
