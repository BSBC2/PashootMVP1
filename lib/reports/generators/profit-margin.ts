import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateProfitMargin(
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

  // Calculate overall margins
  let totalRevenue = 0;
  let totalCOGS = 0; // Cost of Goods Sold
  let totalOperatingExpenses = 0;

  const cogsKeywords = ["inventory", "supplies", "materials", "cogs", "cost of goods"];

  transactions.forEach((t) => {
    const amount = parseFloat(t.amount.toString());
    const category = (t.category || "").toLowerCase();
    const description = t.description.toLowerCase();

    if (t.type === "income") {
      totalRevenue += amount;
    } else if (t.type === "expense") {
      // Categorize as COGS or operating expense
      const isCOGS = cogsKeywords.some((keyword) => category.includes(keyword) || description.includes(keyword));

      if (isCOGS) {
        totalCOGS += amount;
      } else {
        totalOperatingExpenses += amount;
      }
    }
  });

  // Calculate margins
  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const operatingProfit = grossProfit - totalOperatingExpenses;
  const operatingMargin = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;

  const netProfit = totalRevenue - totalCOGS - totalOperatingExpenses;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Monthly profit margin trends
  const monthlyData: Record<string, { revenue: number; cogs: number; opex: number }> = {};

  transactions.forEach((t) => {
    const month = t.date.toISOString().substring(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { revenue: 0, cogs: 0, opex: 0 };
    }

    const amount = parseFloat(t.amount.toString());
    const category = (t.category || "").toLowerCase();
    const description = t.description.toLowerCase();

    if (t.type === "income") {
      monthlyData[month].revenue += amount;
    } else if (t.type === "expense") {
      const isCOGS = cogsKeywords.some((keyword) => category.includes(keyword) || description.includes(keyword));
      if (isCOGS) {
        monthlyData[month].cogs += amount;
      } else {
        monthlyData[month].opex += amount;
      }
    }
  });

  const monthlyMargins = Object.entries(monthlyData)
    .map(([month, data]) => {
      const grossProfit = data.revenue - data.cogs;
      const grossMargin = data.revenue > 0 ? (grossProfit / data.revenue) * 100 : 0;
      const operatingProfit = grossProfit - data.opex;
      const operatingMargin = data.revenue > 0 ? (operatingProfit / data.revenue) * 100 : 0;
      const netProfit = data.revenue - data.cogs - data.opex;
      const netMargin = data.revenue > 0 ? (netProfit / data.revenue) * 100 : 0;

      return {
        month,
        revenue: data.revenue,
        cogs: data.cogs,
        operatingExpenses: data.opex,
        grossMargin,
        operatingMargin,
        netMargin,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    reportType: "Profit Margin Analysis",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    overallMargins: {
      totalRevenue,
      totalCOGS,
      totalOperatingExpenses,
      grossProfit,
      grossMargin,
      operatingProfit,
      operatingMargin,
      netProfit,
      netMargin,
    },
    monthlyMargins,
  };
}
