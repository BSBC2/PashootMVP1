import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateTaxDeductions(
  request: ReportRequest
): Promise<ReportData> {
  const { userId, startDate, endDate } = request;

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

  // Common tax-deductible categories for small businesses
  const deductibleCategories = {
    "Office Expenses": ["office", "supplies", "equipment", "software"],
    "Vehicle & Travel": ["vehicle", "travel", "mileage", "transportation", "fuel", "parking"],
    "Meals & Entertainment": ["meal", "restaurant", "entertainment", "lunch", "dinner", "client"],
    "Professional Services": ["legal", "accounting", "consultant", "professional", "fees"],
    "Insurance": ["insurance"],
    "Marketing & Advertising": ["marketing", "advertising", "promotion", "social media"],
    "Utilities": ["utilities", "internet", "phone", "electricity", "water"],
    "Rent & Lease": ["rent", "lease", "office space"],
    "Education & Training": ["training", "education", "course", "certification", "conference"],
    "Bank Fees & Interest": ["bank fee", "interest", "finance charge"],
    "Repairs & Maintenance": ["repair", "maintenance"],
    "Other Deductible": [],
  };

  // Categorize expenses
  const categorizedDeductions: Record<string, any[]> = {};
  const nonDeductible: any[] = [];

  transactions.forEach((t) => {
    const description = t.description.toLowerCase();
    const category = (t.category || "").toLowerCase();
    const amount = parseFloat(t.amount.toString());
    const metadata = t.metadata as any;

    const expense = {
      date: t.date.toISOString(),
      description: t.description,
      category: t.category || "Uncategorized",
      amount,
    };

    // Check if marked as non-deductible
    if (metadata?.nonDeductible === true) {
      nonDeductible.push(expense);
      return;
    }

    // Try to categorize
    let categorized = false;
    for (const [deductionCategory, keywords] of Object.entries(deductibleCategories)) {
      if (keywords.some((keyword) => description.includes(keyword) || category.includes(keyword))) {
        if (!categorizedDeductions[deductionCategory]) {
          categorizedDeductions[deductionCategory] = [];
        }
        categorizedDeductions[deductionCategory].push(expense);
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      if (!categorizedDeductions["Other Deductible"]) {
        categorizedDeductions["Other Deductible"] = [];
      }
      categorizedDeductions["Other Deductible"].push(expense);
    }
  });

  // Calculate totals by category
  const categoryTotals = Object.entries(categorizedDeductions).map(([category, expenses]) => ({
    category,
    totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
    transactionCount: expenses.length,
    expenses,
  })).sort((a, b) => b.totalAmount - a.totalAmount);

  const totalDeductible = categoryTotals.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalNonDeductible = nonDeductible.reduce((sum, e) => sum + e.amount, 0);

  return {
    reportType: "Tax Deduction Categorization",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    summary: {
      totalDeductible,
      totalNonDeductible,
      totalExpenses: totalDeductible + totalNonDeductible,
      deductiblePercentage: ((totalDeductible / (totalDeductible + totalNonDeductible)) * 100) || 0,
    },
    categoryTotals,
    nonDeductible,
  };
}
