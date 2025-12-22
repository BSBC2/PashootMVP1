import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateQuarterlyTax(
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

  // Calculate quarterly income and expenses
  const quarterlyData: Record<string, { income: number; expenses: number }> = {};

  transactions.forEach((t) => {
    const year = t.date.getFullYear();
    const month = t.date.getMonth(); // 0-11
    const quarter = Math.floor(month / 3) + 1; // 1-4
    const quarterKey = `${year}-Q${quarter}`;

    if (!quarterlyData[quarterKey]) {
      quarterlyData[quarterKey] = { income: 0, expenses: 0 };
    }

    const amount = parseFloat(t.amount.toString());
    if (t.type === "income") {
      quarterlyData[quarterKey].income += amount;
    } else if (t.type === "expense") {
      quarterlyData[quarterKey].expenses += amount;
    }
  });

  // Self-employment tax rate (simplified - would be more complex in reality)
  const SELF_EMPLOYMENT_TAX_RATE = 0.153; // 15.3%
  const ESTIMATED_INCOME_TAX_RATE = 0.22; // Assume 22% bracket

  // Calculate quarterly tax estimates
  const quarters = Object.entries(quarterlyData)
    .map(([quarter, data]) => {
      const netIncome = data.income - data.expenses;
      const selfEmploymentTax = netIncome * SELF_EMPLOYMENT_TAX_RATE;
      const estimatedIncomeTax = netIncome * ESTIMATED_INCOME_TAX_RATE;
      const totalTaxDue = selfEmploymentTax + estimatedIncomeTax;

      return {
        quarter,
        income: data.income,
        expenses: data.expenses,
        netIncome,
        selfEmploymentTax,
        estimatedIncomeTax,
        totalTaxDue,
      };
    })
    .sort((a, b) => a.quarter.localeCompare(b.quarter));

  const annualSummary = {
    totalIncome: quarters.reduce((sum, q) => sum + q.income, 0),
    totalExpenses: quarters.reduce((sum, q) => sum + q.expenses, 0),
    totalNetIncome: quarters.reduce((sum, q) => sum + q.netIncome, 0),
    totalSelfEmploymentTax: quarters.reduce((sum, q) => sum + q.selfEmploymentTax, 0),
    totalEstimatedIncomeTax: quarters.reduce((sum, q) => sum + q.estimatedIncomeTax, 0),
    totalTaxDue: quarters.reduce((sum, q) => sum + q.totalTaxDue, 0),
  };

  return {
    reportType: "Quarterly Tax Summary",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    quarters,
    annualSummary,
    taxRates: {
      selfEmployment: SELF_EMPLOYMENT_TAX_RATE,
      estimatedIncome: ESTIMATED_INCOME_TAX_RATE,
    },
    disclaimer: "This is an estimate only. Consult with a tax professional for accurate tax calculations.",
  };
}
