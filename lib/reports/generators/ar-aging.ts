import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateARAgingReport(
  request: ReportRequest
): Promise<ReportData> {
  const { userId, endDate } = request;

  // For MVP, we'll simulate AR aging using income transactions with specific metadata
  // In a full system, this would track invoices and payments
  const transactions = await db.transaction.findMany({
    where: {
      userId,
      type: "income",
      date: {
        lte: endDate,
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Simulate aging buckets based on transaction dates
  const currentDate = endDate;
  const agingBuckets = {
    current: [] as any[], // 0-30 days
    days31to60: [] as any[], // 31-60 days
    days61to90: [] as any[], // 61-90 days
    over90: [] as any[], // 90+ days
  };

  const customerBalances: Record<string, number> = {};

  transactions.forEach((t) => {
    const metadata = t.metadata as any;
    const customer = metadata?.customer || metadata?.customerName || t.description.split(" - ")[0] || "Unknown Customer";
    const amount = parseFloat(t.amount.toString());

    // Calculate days outstanding
    const daysOld = Math.floor((currentDate.getTime() - t.date.getTime()) / (1000 * 60 * 60 * 24));

    const entry = {
      customer,
      date: t.date.toISOString(),
      description: t.description,
      amount,
      daysOutstanding: daysOld,
    };

    customerBalances[customer] = (customerBalances[customer] || 0) + amount;

    if (daysOld <= 30) {
      agingBuckets.current.push(entry);
    } else if (daysOld <= 60) {
      agingBuckets.days31to60.push(entry);
    } else if (daysOld <= 90) {
      agingBuckets.days61to90.push(entry);
    } else {
      agingBuckets.over90.push(entry);
    }
  });

  const totals = {
    current: agingBuckets.current.reduce((sum, e) => sum + e.amount, 0),
    days31to60: agingBuckets.days31to60.reduce((sum, e) => sum + e.amount, 0),
    days61to90: agingBuckets.days61to90.reduce((sum, e) => sum + e.amount, 0),
    over90: agingBuckets.over90.reduce((sum, e) => sum + e.amount, 0),
  };

  const totalAR = totals.current + totals.days31to60 + totals.days61to90 + totals.over90;

  // Customer summary
  const customerSummary = Object.entries(customerBalances)
    .map(([name, balance]) => ({ customer: name, balance }))
    .sort((a, b) => b.balance - a.balance);

  return {
    reportType: "AR Aging",
    startDate: new Date(0).toISOString(),
    endDate: endDate.toISOString(),
    asOfDate: endDate.toISOString(),
    agingBuckets: {
      current: { count: agingBuckets.current.length, total: totals.current, entries: agingBuckets.current },
      days31to60: { count: agingBuckets.days31to60.length, total: totals.days31to60, entries: agingBuckets.days31to60 },
      days61to90: { count: agingBuckets.days61to90.length, total: totals.days61to90, entries: agingBuckets.days61to90 },
      over90: { count: agingBuckets.over90.length, total: totals.over90, entries: agingBuckets.over90 },
    },
    totalAR,
    customerSummary,
  };
}
