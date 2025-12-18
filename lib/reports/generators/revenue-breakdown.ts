import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateRevenueBreakdown(
  request: ReportRequest
): Promise<ReportData> {
  const { userId, startDate, endDate } = request;

  // Fetch income transactions
  const transactions = await db.transaction.findMany({
    where: {
      userId,
      type: "income",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // By category
  const byCategory: Record<string, number> = {};
  transactions.forEach((t) => {
    const category = t.category || "Uncategorized";
    const amount = parseFloat(t.amount.toString());
    byCategory[category] = (byCategory[category] || 0) + amount;
  });

  // By source
  const bySource: Record<string, number> = {};
  transactions.forEach((t) => {
    const amount = parseFloat(t.amount.toString());
    bySource[t.source] = (bySource[t.source] || 0) + amount;
  });

  // By month
  const byMonth: Record<string, number> = {};
  transactions.forEach((t) => {
    const month = t.date.toISOString().substring(0, 7); // YYYY-MM
    const amount = parseFloat(t.amount.toString());
    byMonth[month] = (byMonth[month] || 0) + amount;
  });

  const totalRevenue = transactions.reduce(
    (sum, t) => sum + parseFloat(t.amount.toString()),
    0
  );

  return {
    reportType: "Revenue Breakdown",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totalRevenue,
    byCategory: Object.entries(byCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalRevenue) * 100,
      }))
      .sort((a, b) => b.amount - a.amount),
    bySource: Object.entries(bySource)
      .map(([source, amount]) => ({
        source,
        amount,
        percentage: (amount / totalRevenue) * 100,
      }))
      .sort((a, b) => b.amount - a.amount),
    byMonth: Object.entries(byMonth)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month)),
  };
}
