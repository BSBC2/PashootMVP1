import { db } from "@/lib/db";
import { ReportRequest, ReportData } from "../types";

export async function generateCashFlow(
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

  // Operating activities
  let operatingInflows = 0;
  let operatingOutflows = 0;

  transactions.forEach((t) => {
    const amount = parseFloat(t.amount.toString());
    const category = t.category?.toLowerCase() || "";

    if (t.type === "income") {
      operatingInflows += amount;
    } else if (t.type === "expense") {
      // Filter out capital and financing expenses
      if (!category.includes("equipment") && !category.includes("loan") && !category.includes("investment")) {
        operatingOutflows += amount;
      }
    }
  });

  const netOperatingCashFlow = operatingInflows - operatingOutflows;

  // Investing activities (simplified - equipment, assets)
  let investingOutflows = 0;
  transactions.forEach((t) => {
    const amount = parseFloat(t.amount.toString());
    const category = t.category?.toLowerCase() || "";

    if (t.type === "expense" && (category.includes("equipment") || category.includes("asset"))) {
      investingOutflows += amount;
    }
  });

  const netInvestingCashFlow = -investingOutflows;

  // Financing activities (loans, owner contributions)
  let financingInflows = 0;
  let financingOutflows = 0;
  transactions.forEach((t) => {
    const amount = parseFloat(t.amount.toString());
    const category = t.category?.toLowerCase() || "";

    if (category.includes("loan") || category.includes("investment")) {
      if (t.type === "income") {
        financingInflows += amount;
      } else {
        financingOutflows += amount;
      }
    }
  });

  const netFinancingCashFlow = financingInflows - financingOutflows;

  // Net change in cash
  const netCashChange = netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow;

  return {
    reportType: "Cash Flow Statement",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    operating: {
      inflows: operatingInflows,
      outflows: operatingOutflows,
      net: netOperatingCashFlow,
    },
    investing: {
      outflows: investingOutflows,
      net: netInvestingCashFlow,
    },
    financing: {
      inflows: financingInflows,
      outflows: financingOutflows,
      net: netFinancingCashFlow,
    },
    netCashChange,
  };
}
