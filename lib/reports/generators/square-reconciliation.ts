import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateSquareReconciliation(
  request: ReportRequest
): Promise<ReportData> {
  const { userId, startDate, endDate } = request;

  // Get all transactions from Square
  const squareTransactions = await db.transaction.findMany({
    where: {
      userId,
      source: "square",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Get all income transactions to find potential duplicates
  const allIncomeTransactions = await db.transaction.findMany({
    where: {
      userId,
      type: "income",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Calculate Square totals
  let squareGrossRevenue = 0;
  let squareFees = 0;
  let squareRefunds = 0;
  let squareNetDeposits = 0;

  const squareByDay: Record<string, { gross: number; fees: number; net: number }> = {};

  squareTransactions.forEach((t) => {
    const metadata = t.metadata as any;
    const amount = parseFloat(t.amount.toString());
    const fee = parseFloat(metadata?.fee || "0");
    const isRefund = metadata?.isRefund === true;

    if (isRefund) {
      squareRefunds += amount;
    } else {
      squareGrossRevenue += amount;
      squareFees += fee;
      squareNetDeposits += amount - fee;
    }

    // Group by day
    const day = t.date.toISOString().split("T")[0];
    if (!squareByDay[day]) {
      squareByDay[day] = { gross: 0, fees: 0, net: 0 };
    }

    if (!isRefund) {
      squareByDay[day].gross += amount;
      squareByDay[day].fees += fee;
      squareByDay[day].net += amount - fee;
    }
  });

  // Match with accounting system
  const accountingSquareRevenue = allIncomeTransactions
    .filter((t) => t.source === "square" || t.description.toLowerCase().includes("square"))
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const reconciliationDifference = squareGrossRevenue - accountingSquareRevenue;
  const isReconciled = Math.abs(reconciliationDifference) < 0.01;

  // Daily reconciliation
  const dailyReconciliation = Object.entries(squareByDay)
    .map(([date, data]) => ({
      date,
      squareGross: data.gross,
      squareFees: data.fees,
      squareNet: data.net,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Identify discrepancies
  const discrepancies: any[] = [];
  if (!isReconciled) {
    discrepancies.push({
      type: "Revenue Mismatch",
      squareAmount: squareGrossRevenue,
      accountingAmount: accountingSquareRevenue,
      difference: reconciliationDifference,
    });
  }

  return {
    reportType: "Square Reconciliation",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    square: {
      grossRevenue: squareGrossRevenue,
      fees: squareFees,
      refunds: squareRefunds,
      netDeposits: squareNetDeposits,
      transactionCount: squareTransactions.filter((t) => !(t.metadata as any)?.isRefund).length,
    },
    accounting: {
      recordedRevenue: accountingSquareRevenue,
    },
    reconciliation: {
      difference: reconciliationDifference,
      isReconciled,
      reconciliationPercentage: squareGrossRevenue > 0 ? (accountingSquareRevenue / squareGrossRevenue) * 100 : 0,
    },
    dailyReconciliation,
    discrepancies,
  };
}
