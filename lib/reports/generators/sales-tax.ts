import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateSalesTaxReport(
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

  // Default sales tax rate (would be configurable in production)
  const DEFAULT_TAX_RATE = 0.08; // 8%

  // Calculate sales and sales tax
  const taxableTransactions: any[] = [];
  const exemptTransactions: any[] = [];
  let totalTaxableSales = 0;
  let totalTaxCollected = 0;

  transactions.forEach((t) => {
    const metadata = t.metadata as any;
    const amount = parseFloat(t.amount.toString());

    // Check if transaction has tax information in metadata
    const taxRate = metadata?.taxRate || DEFAULT_TAX_RATE;
    const isTaxExempt = metadata?.taxExempt === true;

    if (isTaxExempt) {
      exemptTransactions.push({
        date: t.date.toISOString(),
        description: t.description,
        amount,
        reason: metadata?.exemptReason || "Not specified",
      });
    } else {
      const taxAmount = amount * taxRate;
      const grossAmount = amount + taxAmount;

      taxableTransactions.push({
        date: t.date.toISOString(),
        description: t.description,
        netAmount: amount,
        taxRate,
        taxAmount,
        grossAmount,
      });

      totalTaxableSales += amount;
      totalTaxCollected += taxAmount;
    }
  });

  // Group by month for periodic filing
  const monthlyTax: Record<string, { sales: number; tax: number }> = {};

  taxableTransactions.forEach((t) => {
    const month = t.date.substring(0, 7); // YYYY-MM
    if (!monthlyTax[month]) {
      monthlyTax[month] = { sales: 0, tax: 0 };
    }
    monthlyTax[month].sales += t.netAmount;
    monthlyTax[month].tax += t.taxAmount;
  });

  const monthlyData = Object.entries(monthlyTax)
    .map(([month, data]) => ({
      month,
      taxableSales: data.sales,
      taxCollected: data.tax,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    reportType: "Sales Tax Report",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    summary: {
      totalTaxableSales,
      totalTaxCollected,
      totalExemptSales: exemptTransactions.reduce((sum, t) => sum + t.amount, 0),
      averageTaxRate: totalTaxableSales > 0 ? (totalTaxCollected / totalTaxableSales) : DEFAULT_TAX_RATE,
    },
    taxableTransactions,
    exemptTransactions,
    monthlyData,
  };
}
