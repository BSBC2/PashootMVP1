import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateBudgetVsActual(
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

  // For MVP, create a simple budget based on historical averages
  // In production, budgets would be set by the user
  const monthlyBudget = {
    income: 10000, // Default budget targets
    expenses: 7000,
    netIncome: 3000,
  };

  // Group by month
  const monthlyActuals: Record<string, { income: number; expenses: number }> = {};

  transactions.forEach((t) => {
    const month = t.date.toISOString().substring(0, 7); // YYYY-MM
    if (!monthlyActuals[month]) {
      monthlyActuals[month] = { income: 0, expenses: 0 };
    }

    const amount = parseFloat(t.amount.toString());
    if (t.type === "income") {
      monthlyActuals[month].income += amount;
    } else if (t.type === "expense") {
      monthlyActuals[month].expenses += amount;
    }
  });

  // Compare budget vs actual
  const comparison = Object.entries(monthlyActuals)
    .map(([month, actual]) => {
      const netIncome = actual.income - actual.expenses;

      return {
        month,
        budget: {
          income: monthlyBudget.income,
          expenses: monthlyBudget.expenses,
          netIncome: monthlyBudget.netIncome,
        },
        actual: {
          income: actual.income,
          expenses: actual.expenses,
          netIncome,
        },
        variance: {
          income: actual.income - monthlyBudget.income,
          expenses: actual.expenses - monthlyBudget.expenses,
          netIncome: netIncome - monthlyBudget.netIncome,
        },
        percentageVariance: {
          income: monthlyBudget.income > 0 ? ((actual.income - monthlyBudget.income) / monthlyBudget.income) * 100 : 0,
          expenses: monthlyBudget.expenses > 0 ? ((actual.expenses - monthlyBudget.expenses) / monthlyBudget.expenses) * 100 : 0,
          netIncome: monthlyBudget.netIncome > 0 ? ((netIncome - monthlyBudget.netIncome) / monthlyBudget.netIncome) * 100 : 0,
        },
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate overall performance
  const totalBudgetIncome = monthlyBudget.income * comparison.length;
  const totalActualIncome = comparison.reduce((sum, c) => sum + c.actual.income, 0);
  const totalBudgetExpenses = monthlyBudget.expenses * comparison.length;
  const totalActualExpenses = comparison.reduce((sum, c) => sum + c.actual.expenses, 0);

  return {
    reportType: "Budget vs Actual",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    monthlyComparison: comparison,
    overallPerformance: {
      budget: {
        totalIncome: totalBudgetIncome,
        totalExpenses: totalBudgetExpenses,
        totalNetIncome: totalBudgetIncome - totalBudgetExpenses,
      },
      actual: {
        totalIncome: totalActualIncome,
        totalExpenses: totalActualExpenses,
        totalNetIncome: totalActualIncome - totalActualExpenses,
      },
      variance: {
        income: totalActualIncome - totalBudgetIncome,
        expenses: totalActualExpenses - totalBudgetExpenses,
        netIncome: (totalActualIncome - totalActualExpenses) - (totalBudgetIncome - totalBudgetExpenses),
      },
    },
    note: "Budget figures are defaults for MVP. In production, users can set custom budgets.",
  };
}
