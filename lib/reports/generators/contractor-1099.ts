import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateContractor1099Report(
  request: ReportRequest
): Promise<ReportData> {
  const { userId, startDate, endDate } = request;

  // Fetch expense transactions that might be contractor payments
  // Looking for patterns like "contractor", "freelancer", "consultant", etc.
  const transactions = await db.transaction.findMany({
    where: {
      userId,
      type: "expense",
      date: {
        gte: startDate,
        lte: endDate,
      },
      OR: [
        { category: { contains: "contractor", mode: "insensitive" } },
        { category: { contains: "freelance", mode: "insensitive" } },
        { category: { contains: "consultant", mode: "insensitive" } },
        { description: { contains: "contractor", mode: "insensitive" } },
        { description: { contains: "freelance", mode: "insensitive" } },
        { description: { contains: "consultant", mode: "insensitive" } },
      ],
    },
    orderBy: {
      date: "asc",
    },
  });

  // Group by vendor/payee (using description as identifier)
  const contractorPayments: Record<
    string,
    { total: number; count: number; transactions: any[] }
  > = {};

  transactions.forEach((t) => {
    const contractor = t.description; // In real app, would extract payee name
    const amount = parseFloat(t.amount.toString());

    if (!contractorPayments[contractor]) {
      contractorPayments[contractor] = { total: 0, count: 0, transactions: [] };
    }

    contractorPayments[contractor].total += amount;
    contractorPayments[contractor].count += 1;
    contractorPayments[contractor].transactions.push({
      date: t.date,
      amount,
      description: t.description,
    });
  });

  // Filter contractors who need 1099 ($600+ threshold)
  const threshold = 600;
  const contractors1099Required = Object.entries(contractorPayments)
    .filter(([_, data]) => data.total >= threshold)
    .map(([name, data]) => ({
      name,
      totalPaid: data.total,
      transactionCount: data.count,
      requires1099: true,
      transactions: data.transactions,
    }))
    .sort((a, b) => b.totalPaid - a.totalPaid);

  const contractorsBelowThreshold = Object.entries(contractorPayments)
    .filter(([_, data]) => data.total < threshold)
    .map(([name, data]) => ({
      name,
      totalPaid: data.total,
      transactionCount: data.count,
      requires1099: false,
    }))
    .sort((a, b) => b.totalPaid - a.totalPaid);

  const totalContractorPayments = Object.values(contractorPayments).reduce(
    (sum, data) => sum + data.total,
    0
  );

  return {
    reportType: "1099 Contractor Report",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    year: startDate.getFullYear(),
    summary: {
      totalContractors: Object.keys(contractorPayments).length,
      contractors1099Required: contractors1099Required.length,
      totalPayments: totalContractorPayments,
      threshold,
    },
    contractors1099Required,
    contractorsBelowThreshold,
  };
}
