import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateCrossSourceSummary(
  request: ReportRequest
): Promise<ReportData> {
  const { userId, startDate, endDate } = request;

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

  // Get active connections
  const connections = await db.connection.findMany({
    where: {
      userId,
    },
  });

  // Group by source
  const sourceData: Record<string, {
    income: number;
    expenses: number;
    transactionCount: number;
    lastSync: Date | null;
  }> = {};

  transactions.forEach((t) => {
    if (!sourceData[t.source]) {
      sourceData[t.source] = {
        income: 0,
        expenses: 0,
        transactionCount: 0,
        lastSync: null,
      };
    }

    const amount = parseFloat(t.amount.toString());
    if (t.type === "income") {
      sourceData[t.source].income += amount;
    } else if (t.type === "expense") {
      sourceData[t.source].expenses += amount;
    }
    sourceData[t.source].transactionCount++;
  });

  // Add last sync info from connections
  connections.forEach((conn) => {
    if (sourceData[conn.source]) {
      sourceData[conn.source].lastSync = conn.lastSyncAt;
    }
  });

  // Create source summaries
  const sourceSummaries = Object.entries(sourceData).map(([source, data]) => ({
    source,
    income: data.income,
    expenses: data.expenses,
    netActivity: data.income - data.expenses,
    transactionCount: data.transactionCount,
    lastSync: data.lastSync?.toISOString() || null,
    connectionStatus: connections.find((c) => c.source === source) ? "Connected" : "Not Connected",
  })).sort((a, b) => b.netActivity - a.netActivity);

  // Calculate totals
  const totalIncome = sourceSummaries.reduce((sum, s) => sum + s.income, 0);
  const totalExpenses = sourceSummaries.reduce((sum, s) => sum + s.expenses, 0);
  const totalTransactions = sourceSummaries.reduce((sum, s) => sum + s.transactionCount, 0);

  // Source contribution percentages
  const sourceContributions = sourceSummaries.map((s) => ({
    source: s.source,
    incomePercentage: totalIncome > 0 ? (s.income / totalIncome) * 100 : 0,
    expensePercentage: totalExpenses > 0 ? (s.expenses / totalExpenses) * 100 : 0,
    transactionPercentage: totalTransactions > 0 ? (s.transactionCount / totalTransactions) * 100 : 0,
  }));

  // Monthly breakdown by source
  const monthlyBySource: Record<string, Record<string, { income: number; expenses: number }>> = {};

  transactions.forEach((t) => {
    const month = t.date.toISOString().substring(0, 7);
    if (!monthlyBySource[month]) {
      monthlyBySource[month] = {};
    }
    if (!monthlyBySource[month][t.source]) {
      monthlyBySource[month][t.source] = { income: 0, expenses: 0 };
    }

    const amount = parseFloat(t.amount.toString());
    if (t.type === "income") {
      monthlyBySource[month][t.source].income += amount;
    } else if (t.type === "expense") {
      monthlyBySource[month][t.source].expenses += amount;
    }
  });

  const monthlyData = Object.entries(monthlyBySource)
    .map(([month, sources]) => ({
      month,
      sources: Object.entries(sources).map(([source, data]) => ({
        source,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
      })),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    reportType: "Cross-Source Summary",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    summary: {
      totalIncome,
      totalExpenses,
      netActivity: totalIncome - totalExpenses,
      totalTransactions,
      sourcesConnected: connections.length,
      sourcesWithData: sourceSummaries.length,
    },
    sourceSummaries,
    sourceContributions,
    monthlyData,
    connectedSources: connections.map((c) => ({
      source: c.source,
      lastSync: c.lastSyncAt?.toISOString() || null,
      connectedAt: c.createdAt.toISOString(),
    })),
  };
}
