import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateBalanceSheet(
  request: ReportRequest
): Promise<ReportData> {
  const { userId, endDate } = request;

  // Get all transactions up to the end date to calculate balances
  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        lte: endDate,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Calculate assets (cumulative income - expenses)
  let cashBalance = 0;
  let totalRevenue = 0;
  let totalExpenses = 0;

  transactions.forEach((t) => {
    const amount = parseFloat(t.amount.toString());
    if (t.type === "income") {
      cashBalance += amount;
      totalRevenue += amount;
    } else if (t.type === "expense") {
      cashBalance -= amount;
      totalExpenses += amount;
    }
  });

  // Simplified balance sheet for MVP (cash basis)
  const assets = {
    currentAssets: {
      cash: cashBalance,
      accountsReceivable: 0, // Would need AR data
    },
    total: cashBalance,
  };

  const liabilities = {
    currentLiabilities: {
      accountsPayable: 0, // Would need AP data
      accruedExpenses: 0,
    },
    total: 0,
  };

  const equity = {
    retainedEarnings: totalRevenue - totalExpenses,
    total: totalRevenue - totalExpenses,
  };

  // Assets = Liabilities + Equity
  const totalAssets = assets.total;
  const totalLiabilitiesAndEquity = liabilities.total + equity.total;

  return {
    reportType: "Balance Sheet",
    startDate: new Date(0).toISOString(), // Beginning of time
    endDate: endDate.toISOString(),
    asOfDate: endDate.toISOString(),
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilitiesAndEquity,
    balanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
  };
}
