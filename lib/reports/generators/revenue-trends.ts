import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateRevenueTrends(
  request: ReportRequest
): Promise<ReportData> {
  const { userId, startDate, endDate } = request;

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

  // Group by month
  const monthlyRevenue: Record<string, number> = {};
  const monthlyCount: Record<string, number> = {};

  transactions.forEach((t) => {
    const month = t.date.toISOString().substring(0, 7); // YYYY-MM format
    const amount = parseFloat(t.amount.toString());

    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + amount;
    monthlyCount[month] = (monthlyCount[month] || 0) + 1;
  });

  // Convert to array for easier processing
  const months = Object.keys(monthlyRevenue).sort();
  const monthlyData = months.map((month) => ({
    month,
    revenue: monthlyRevenue[month],
    transactionCount: monthlyCount[month],
    averagePerTransaction: monthlyRevenue[month] / monthlyCount[month],
  }));

  // Calculate growth rates
  const dataWithGrowth = monthlyData.map((data, index) => {
    if (index === 0) {
      return { ...data, growthRate: 0, growthAmount: 0 };
    }

    const prevRevenue = monthlyData[index - 1].revenue;
    const growthAmount = data.revenue - prevRevenue;
    const growthRate = prevRevenue > 0 ? (growthAmount / prevRevenue) * 100 : 0;

    return {
      ...data,
      growthRate,
      growthAmount,
    };
  });

  // Calculate overall statistics
  const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const averageMonthlyRevenue = totalRevenue / Math.max(months.length, 1);
  const highestMonth = monthlyData.reduce((max, d) => (d.revenue > max.revenue ? d : max), monthlyData[0] || { revenue: 0 });
  const lowestMonth = monthlyData.reduce((min, d) => (d.revenue < min.revenue ? d : min), monthlyData[0] || { revenue: 0 });

  return {
    reportType: "Revenue Trends",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    monthlyData: dataWithGrowth,
    totalRevenue,
    averageMonthlyRevenue,
    highestMonth: highestMonth || null,
    lowestMonth: lowestMonth || null,
    monthsIncluded: months.length,
  };
}
