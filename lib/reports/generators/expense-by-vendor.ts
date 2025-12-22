import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateExpenseByVendor(
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

  // Group by vendor (extract from description or metadata)
  const vendorExpenses: Record<string, { total: number; count: number; categories: Set<string> }> = {};

  transactions.forEach((t) => {
    // Try to extract vendor name from metadata or description
    const metadata = t.metadata as any;
    const vendor = metadata?.vendor || metadata?.vendorName || t.description.split(" - ")[0] || "Unknown Vendor";

    if (!vendorExpenses[vendor]) {
      vendorExpenses[vendor] = { total: 0, count: 0, categories: new Set() };
    }

    const amount = parseFloat(t.amount.toString());
    vendorExpenses[vendor].total += amount;
    vendorExpenses[vendor].count += 1;
    if (t.category) {
      vendorExpenses[vendor].categories.add(t.category);
    }
  });

  // Convert to array and sort by total expenses
  const vendorList = Object.entries(vendorExpenses)
    .map(([name, data]) => ({
      vendor: name,
      totalExpenses: data.total,
      transactionCount: data.count,
      averageExpense: data.total / data.count,
      categories: Array.from(data.categories),
    }))
    .sort((a, b) => b.totalExpenses - a.totalExpenses);

  const totalExpenses = vendorList.reduce((sum, v) => sum + v.totalExpenses, 0);

  // Top 10 vendors
  const top10 = vendorList.slice(0, 10);
  const top10Total = top10.reduce((sum, v) => sum + v.totalExpenses, 0);
  const top10Percentage = totalExpenses > 0 ? (top10Total / totalExpenses) * 100 : 0;

  return {
    reportType: "Expense by Vendor",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    vendors: vendorList,
    totalExpenses,
    totalVendors: vendorList.length,
    top10Vendors: top10,
    top10Percentage,
  };
}
