import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateIncomeStatement(
  request: ReportRequest
): Promise<ReportData> {
  const { userId, startDate, endDate } = request;

  // Fetch transactions in date range
  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Calculate revenue
  const revenueTransactions = transactions.filter((t) => t.type === "income");
  const revenueByCategory: Record<string, number> = {};
  let totalRevenue = 0;

  revenueTransactions.forEach((t) => {
    const category = t.category || "Uncategorized";
    const amount = parseFloat(t.amount.toString());
    revenueByCategory[category] = (revenueByCategory[category] || 0) + amount;
    totalRevenue += amount;
  });

  // Calculate expenses
  const expenseTransactions = transactions.filter((t) => t.type === "expense");
  const expensesByCategory: Record<string, number> = {};
  let totalExpenses = 0;

  expenseTransactions.forEach((t) => {
    const category = t.category || "Uncategorized";
    const amount = parseFloat(t.amount.toString());
    expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
    totalExpenses += amount;
  });

  // Calculate net income
  const netIncome = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

  return {
    reportType: "Income Statement (P&L)",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    revenue: {
      categories: Object.entries(revenueByCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      total: totalRevenue,
    },
    expenses: {
      categories: Object.entries(expensesByCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      total: totalExpenses,
    },
    netIncome,
    profitMargin,
  };
}
