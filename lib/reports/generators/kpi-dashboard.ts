import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateKPIDashboard(
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

  // Calculate key metrics
  let totalRevenue = 0;
  let totalExpenses = 0;
  let transactionCount = 0;
  const customers = new Set<string>();
  const vendors = new Set<string>();

  transactions.forEach((t) => {
    const amount = parseFloat(t.amount.toString());
    const metadata = t.metadata as any;

    if (t.type === "income") {
      totalRevenue += amount;
      transactionCount++;
      const customer = metadata?.customer || metadata?.customerName || t.description.split(" - ")[0];
      if (customer && customer !== "Unknown Customer") {
        customers.add(customer);
      }
    } else if (t.type === "expense") {
      totalExpenses += amount;
      const vendor = metadata?.vendor || metadata?.vendorName || t.description.split(" - ")[0];
      if (vendor && vendor !== "Unknown Vendor") {
        vendors.add(vendor);
      }
    }
  });

  const netIncome = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
  const averageRevenuePerTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;

  // Calculate monthly growth
  const monthlyRevenue: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.type === "income") {
      const month = t.date.toISOString().substring(0, 7);
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + parseFloat(t.amount.toString());
    }
  });

  const months = Object.keys(monthlyRevenue).sort();
  let monthlyGrowthRate = 0;
  if (months.length >= 2) {
    const lastMonth = monthlyRevenue[months[months.length - 1]];
    const previousMonth = monthlyRevenue[months[months.length - 2]];
    monthlyGrowthRate = previousMonth > 0 ? ((lastMonth - previousMonth) / previousMonth) * 100 : 0;
  }

  // Calculate run rate (annualized)
  const periodDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const annualRunRate = (totalRevenue / periodDays) * 365;

  // Expense ratio
  const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

  // Cash burn rate (for startups)
  const avgMonthlyExpenses = months.length > 0 ? totalExpenses / months.length : 0;
  const cashBurnRate = netIncome < 0 ? Math.abs(netIncome / Math.max(1, months.length)) : 0;

  // Customer metrics
  const averageRevenuePerCustomer = customers.size > 0 ? totalRevenue / customers.size : 0;

  return {
    reportType: "KPI Dashboard",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    kpis: {
      financial: {
        totalRevenue,
        totalExpenses,
        netIncome,
        profitMargin,
        expenseRatio,
        annualRunRate,
      },
      growth: {
        monthlyGrowthRate,
        revenueGrowth: monthlyGrowthRate,
      },
      customers: {
        totalCustomers: customers.size,
        averageRevenuePerCustomer,
        averageRevenuePerTransaction,
        totalTransactions: transactionCount,
      },
      vendors: {
        totalVendors: vendors.size,
        averageExpensePerVendor: vendors.size > 0 ? totalExpenses / vendors.size : 0,
      },
      operational: {
        avgMonthlyRevenue: months.length > 0 ? totalRevenue / months.length : 0,
        avgMonthlyExpenses,
        cashBurnRate,
      },
    },
    monthlyTrends: months.map((month) => ({
      month,
      revenue: monthlyRevenue[month] || 0,
    })),
  };
}
