import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateBreakEven(
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

  // Categorize expenses as fixed vs variable
  const fixedExpenseKeywords = ["rent", "lease", "salary", "insurance", "subscription", "loan"];
  const variableExpenseKeywords = ["supplies", "materials", "cogs", "shipping", "commission"];

  let totalRevenue = 0;
  let totalFixedCosts = 0;
  let totalVariableCosts = 0;
  let transactionCount = 0;

  transactions.forEach((t) => {
    const amount = parseFloat(t.amount.toString());
    const category = (t.category || "").toLowerCase();
    const description = t.description.toLowerCase();

    if (t.type === "income") {
      totalRevenue += amount;
      transactionCount++;
    } else if (t.type === "expense") {
      const isFixed = fixedExpenseKeywords.some((keyword) => category.includes(keyword) || description.includes(keyword));
      const isVariable = variableExpenseKeywords.some((keyword) => category.includes(keyword) || description.includes(keyword));

      if (isFixed) {
        totalFixedCosts += amount;
      } else if (isVariable) {
        totalVariableCosts += amount;
      } else {
        // Default to fixed if uncertain
        totalFixedCosts += amount;
      }
    }
  });

  // Calculate break-even metrics
  const contributionMargin = totalRevenue - totalVariableCosts;
  const contributionMarginRatio = totalRevenue > 0 ? contributionMargin / totalRevenue : 0;

  // Break-even revenue = Fixed Costs / Contribution Margin Ratio
  const breakEvenRevenue = contributionMarginRatio > 0 ? totalFixedCosts / contributionMarginRatio : 0;

  // Break-even units (if we have unit data)
  const averageRevenuePerTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;
  const averageVariableCostPerTransaction = transactionCount > 0 ? totalVariableCosts / transactionCount : 0;
  const contributionPerUnit = averageRevenuePerTransaction - averageVariableCostPerTransaction;
  const breakEvenUnits = contributionPerUnit > 0 ? Math.ceil(totalFixedCosts / contributionPerUnit) : 0;

  // Current status
  const currentRevenue = totalRevenue;
  const revenueToBreakEven = Math.max(0, breakEvenRevenue - currentRevenue);
  const unitsToBreakEven = Math.max(0, breakEvenUnits - transactionCount);
  const isAboveBreakEven = currentRevenue >= breakEvenRevenue;

  // Monthly analysis
  const monthlyData: Record<string, { revenue: number; fixedCosts: number; variableCosts: number; units: number }> = {};

  transactions.forEach((t) => {
    const month = t.date.toISOString().substring(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { revenue: 0, fixedCosts: 0, variableCosts: 0, units: 0 };
    }

    const amount = parseFloat(t.amount.toString());
    const category = (t.category || "").toLowerCase();
    const description = t.description.toLowerCase();

    if (t.type === "income") {
      monthlyData[month].revenue += amount;
      monthlyData[month].units++;
    } else if (t.type === "expense") {
      const isFixed = fixedExpenseKeywords.some((keyword) => category.includes(keyword) || description.includes(keyword));
      const isVariable = variableExpenseKeywords.some((keyword) => category.includes(keyword) || description.includes(keyword));

      if (isFixed || (!isFixed && !isVariable)) {
        monthlyData[month].fixedCosts += amount;
      } else {
        monthlyData[month].variableCosts += amount;
      }
    }
  });

  const monthlyBreakEven = Object.entries(monthlyData)
    .map(([month, data]) => {
      const contributionMargin = data.revenue - data.variableCosts;
      const contributionMarginRatio = data.revenue > 0 ? contributionMargin / data.revenue : 0;
      const breakEvenRevenue = contributionMarginRatio > 0 ? data.fixedCosts / contributionMarginRatio : 0;
      const isAboveBreakEven = data.revenue >= breakEvenRevenue;

      return {
        month,
        revenue: data.revenue,
        fixedCosts: data.fixedCosts,
        variableCosts: data.variableCosts,
        breakEvenRevenue,
        isAboveBreakEven,
        surplus: data.revenue - breakEvenRevenue,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    reportType: "Break-Even Analysis",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    summary: {
      totalRevenue,
      totalFixedCosts,
      totalVariableCosts,
      contributionMargin,
      contributionMarginRatio,
      breakEvenRevenue,
      breakEvenUnits,
      currentRevenue,
      revenueToBreakEven,
      unitsToBreakEven,
      isAboveBreakEven,
    },
    monthlyBreakEven,
  };
}
