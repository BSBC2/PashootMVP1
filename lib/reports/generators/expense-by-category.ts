import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateExpenseByCategory(
  request: ReportRequest
): Promise<ReportData> {
  const { userId, startDate, endDate } = request;

  // Fetch expense transactions
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

  // Group by category
  const byCategory: Record<string, { amount: number; count: number; transactions: any[] }> = {};

  transactions.forEach((t) => {
    const category = t.category || "Uncategorized";
    const amount = parseFloat(t.amount.toString());

    if (!byCategory[category]) {
      byCategory[category] = { amount: 0, count: 0, transactions: [] };
    }

    byCategory[category].amount += amount;
    byCategory[category].count += 1;
    byCategory[category].transactions.push({
      date: t.date,
      description: t.description,
      amount,
    });
  });

  const totalExpenses = transactions.reduce(
    (sum, t) => sum + parseFloat(t.amount.toString()),
    0
  );

  // Calculate trends by month
  const byMonth: Record<string, number> = {};
  transactions.forEach((t) => {
    const month = t.date.toISOString().substring(0, 7);
    const amount = parseFloat(t.amount.toString());
    byMonth[month] = (byMonth[month] || 0) + amount;
  });

  return {
    reportType: "Expense Report by Category",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totalExpenses,
    categories: Object.entries(byCategory)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: (data.amount / totalExpenses) * 100,
        avgPerTransaction: data.amount / data.count,
        topTransactions: data.transactions
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5),
      }))
      .sort((a, b) => b.amount - a.amount),
    trends: Object.entries(byMonth)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month)),
  };
}
