import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateStripeReconciliation(
  request: ReportRequest
): Promise<ReportData> {
  const { userId, startDate, endDate } = request;

  // Fetch Stripe transactions
  const stripeTransactions = await db.transaction.findMany({
    where: {
      userId,
      source: "stripe",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Separate charges, fees, and other transactions
  const charges = stripeTransactions.filter(
    (t) => t.category === "stripe_payment" && t.type === "income"
  );
  const fees = stripeTransactions.filter((t) => t.category?.includes("fee"));
  const refunds = stripeTransactions.filter((t) => t.category?.includes("refund"));

  // Calculate totals
  const grossRevenue = charges.reduce(
    (sum, t) => sum + parseFloat(t.amount.toString()),
    0
  );
  const totalFees = fees.reduce(
    (sum, t) => sum + parseFloat(t.amount.toString()),
    0
  );
  const totalRefunds = refunds.reduce(
    (sum, t) => sum + parseFloat(t.amount.toString()),
    0
  );
  const netRevenue = grossRevenue - totalFees - totalRefunds;

  // Group by day for timeline
  const dailyBreakdown: Record<string, any> = {};
  stripeTransactions.forEach((t) => {
    const date = t.date.toISOString().split("T")[0];
    if (!dailyBreakdown[date]) {
      dailyBreakdown[date] = {
        date,
        charges: 0,
        fees: 0,
        refunds: 0,
        net: 0,
      };
    }

    const amount = parseFloat(t.amount.toString());
    if (t.category === "stripe_payment") {
      dailyBreakdown[date].charges += amount;
    } else if (t.category?.includes("fee")) {
      dailyBreakdown[date].fees += amount;
    } else if (t.category?.includes("refund")) {
      dailyBreakdown[date].refunds += amount;
    }

    dailyBreakdown[date].net =
      dailyBreakdown[date].charges -
      dailyBreakdown[date].fees -
      dailyBreakdown[date].refunds;
  });

  return {
    reportType: "Stripe Reconciliation",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    summary: {
      grossRevenue,
      totalFees,
      totalRefunds,
      netRevenue,
      feePercentage: grossRevenue > 0 ? (totalFees / grossRevenue) * 100 : 0,
      transactionCount: charges.length,
      avgTransactionSize: charges.length > 0 ? grossRevenue / charges.length : 0,
    },
    dailyBreakdown: Object.values(dailyBreakdown).sort((a: any, b: any) =>
      a.date.localeCompare(b.date)
    ),
    transactions: {
      charges: charges.slice(0, 50).map((t) => ({
        date: t.date,
        description: t.description,
        amount: parseFloat(t.amount.toString()),
        metadata: t.metadata,
      })),
      fees: fees.map((t) => ({
        date: t.date,
        description: t.description,
        amount: parseFloat(t.amount.toString()),
      })),
      refunds: refunds.map((t) => ({
        date: t.date,
        description: t.description,
        amount: parseFloat(t.amount.toString()),
      })),
    },
  };
}
