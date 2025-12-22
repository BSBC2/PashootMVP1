import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateSalesByCustomer(
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

  // Group by customer (extract from description or metadata)
  const customerSales: Record<string, { total: number; count: number; transactions: any[] }> = {};

  transactions.forEach((t) => {
    // Try to extract customer name from metadata or description
    const metadata = t.metadata as any;
    const customer = metadata?.customer || metadata?.customerName || t.description.split(" - ")[0] || "Unknown Customer";

    if (!customerSales[customer]) {
      customerSales[customer] = { total: 0, count: 0, transactions: [] };
    }

    const amount = parseFloat(t.amount.toString());
    customerSales[customer].total += amount;
    customerSales[customer].count += 1;
    customerSales[customer].transactions.push({
      date: t.date.toISOString(),
      description: t.description,
      amount,
    });
  });

  // Convert to array and sort by total sales
  const customerList = Object.entries(customerSales)
    .map(([name, data]) => ({
      customer: name,
      totalSales: data.total,
      transactionCount: data.count,
      averageSale: data.total / data.count,
      transactions: data.transactions,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);

  const totalSales = customerList.reduce((sum, c) => sum + c.totalSales, 0);

  // Top 10 customers
  const top10 = customerList.slice(0, 10);
  const top10Total = top10.reduce((sum, c) => sum + c.totalSales, 0);
  const top10Percentage = totalSales > 0 ? (top10Total / totalSales) * 100 : 0;

  return {
    reportType: "Sales by Customer",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    customers: customerList,
    totalSales,
    totalCustomers: customerList.length,
    top10Customers: top10,
    top10Percentage,
  };
}
