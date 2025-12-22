import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateTrialBalance(
  request: ReportRequest
): Promise<ReportData> {
  const { userId, endDate } = request;

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

  // Group by category and calculate debits/credits
  const accounts: Record<string, { debits: number; credits: number; balance: number }> = {};

  transactions.forEach((t) => {
    const category = t.category || "Uncategorized";
    const amount = parseFloat(t.amount.toString());

    if (!accounts[category]) {
      accounts[category] = { debits: 0, credits: 0, balance: 0 };
    }

    if (t.type === "income") {
      accounts[category].credits += amount;
      accounts[category].balance -= amount; // Credits decrease account balance
    } else if (t.type === "expense") {
      accounts[category].debits += amount;
      accounts[category].balance += amount; // Debits increase account balance
    }
  });

  // Calculate totals
  let totalDebits = 0;
  let totalCredits = 0;

  const accountList = Object.entries(accounts).map(([name, data]) => {
    totalDebits += data.debits;
    totalCredits += data.credits;
    return {
      account: name,
      debits: data.debits,
      credits: data.credits,
      balance: data.balance,
    };
  }).sort((a, b) => a.account.localeCompare(b.account));

  const balanced = Math.abs(totalDebits - totalCredits) < 0.01;

  return {
    reportType: "Trial Balance",
    startDate: new Date(0).toISOString(),
    endDate: endDate.toISOString(),
    asOfDate: endDate.toISOString(),
    accounts: accountList,
    totalDebits,
    totalCredits,
    difference: totalDebits - totalCredits,
    balanced,
  };
}
