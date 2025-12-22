import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateTravelEntertainment(
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

  // Filter for travel and entertainment expenses
  const travelKeywords = ["travel", "flight", "hotel", "airfare", "lodging", "car rental", "uber", "lyft", "taxi", "mileage", "transportation"];
  const entertainmentKeywords = ["meal", "restaurant", "entertainment", "dinner", "lunch", "coffee", "catering", "food"];

  const travelExpenses: any[] = [];
  const entertainmentExpenses: any[] = [];
  const combinedExpenses: any[] = [];

  transactions.forEach((t) => {
    const description = t.description.toLowerCase();
    const category = (t.category || "").toLowerCase();
    const amount = parseFloat(t.amount.toString());

    const isTravel = travelKeywords.some((keyword) => description.includes(keyword) || category.includes(keyword));
    const isEntertainment = entertainmentKeywords.some((keyword) => description.includes(keyword) || category.includes(keyword));

    const expense = {
      date: t.date.toISOString(),
      description: t.description,
      category: t.category || "Uncategorized",
      amount,
    };

    if (isTravel) {
      travelExpenses.push(expense);
    }
    if (isEntertainment) {
      entertainmentExpenses.push(expense);
    }
    if (isTravel || isEntertainment) {
      combinedExpenses.push({ ...expense, type: isTravel ? "Travel" : "Entertainment" });
    }
  });

  const totalTravel = travelExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalEntertainment = entertainmentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCombined = totalTravel + totalEntertainment;

  // Group by month for trends
  const monthlyTotals: Record<string, { travel: number; entertainment: number }> = {};
  combinedExpenses.forEach((e) => {
    const month = e.date.substring(0, 7); // YYYY-MM
    if (!monthlyTotals[month]) {
      monthlyTotals[month] = { travel: 0, entertainment: 0 };
    }
    if (e.type === "Travel") {
      monthlyTotals[month].travel += e.amount;
    } else {
      monthlyTotals[month].entertainment += e.amount;
    }
  });

  const monthlyData = Object.entries(monthlyTotals)
    .map(([month, data]) => ({
      month,
      travel: data.travel,
      entertainment: data.entertainment,
      total: data.travel + data.entertainment,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    reportType: "Travel & Entertainment",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    travelExpenses: {
      transactions: travelExpenses,
      total: totalTravel,
      count: travelExpenses.length,
    },
    entertainmentExpenses: {
      transactions: entertainmentExpenses,
      total: totalEntertainment,
      count: entertainmentExpenses.length,
    },
    totalCombined,
    monthlyData,
  };
}
