import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateCustomerStatement(
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

  // Group by customer
  const customerStatements: Record<string, any[]> = {};

  transactions.forEach((t) => {
    const metadata = t.metadata as any;
    const customer = metadata?.customer || metadata?.customerName || t.description.split(" - ")[0] || "Unknown Customer";

    if (!customerStatements[customer]) {
      customerStatements[customer] = [];
    }

    customerStatements[customer].push({
      date: t.date.toISOString(),
      description: t.description,
      amount: parseFloat(t.amount.toString()),
      source: t.source,
    });
  });

  // Create statement for each customer
  const statements = Object.entries(customerStatements).map(([customer, transactions]) => {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const count = transactions.length;

    return {
      customer,
      transactions,
      totalSales: total,
      transactionCount: count,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
    };
  }).sort((a, b) => b.totalSales - a.totalSales);

  const totalRevenue = statements.reduce((sum, s) => sum + s.totalSales, 0);

  return {
    reportType: "Customer Statement",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    statements,
    totalCustomers: statements.length,
    totalRevenue,
  };
}
