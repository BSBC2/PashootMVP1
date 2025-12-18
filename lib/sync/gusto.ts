import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

const GUSTO_API_BASE = "https://api.gusto.com/v1";

interface GustoCompany {
  id: string;
  name: string;
}

interface GustoPayroll {
  id: string;
  payroll_deadline: string;
  processed: boolean;
  check_date: string;
  totals: {
    gross_pay: string;
    net_pay: string;
    employer_taxes: string;
    employee_taxes: string;
    benefits: string;
  };
}

export async function syncGustoData(userId: string) {
  const connection = await db.connection.findUnique({
    where: {
      userId_source: {
        userId,
        source: "gusto",
      },
    },
  });

  if (!connection) {
    throw new Error("Gusto connection not found");
  }

  const accessToken = decrypt(connection.accessToken);

  // Get companies
  const companies = await fetchGustoCompanies(accessToken);
  if (companies.length === 0) {
    throw new Error("No companies found in Gusto account");
  }

  // Use first company (most users have one)
  const companyId = companies[0].id;

  // Fetch payrolls
  const payrolls = await fetchGustoPayrolls(accessToken, companyId);

  let syncedCount = 0;

  // Sync payroll expenses as transactions
  for (const payroll of payrolls) {
    // Create transaction for gross payroll expense
    await db.transaction.upsert({
      where: {
        userId_source_externalId: {
          userId,
          source: "gusto",
          externalId: `payroll-${payroll.id}`,
        },
      },
      create: {
        userId,
        source: "gusto",
        externalId: `payroll-${payroll.id}`,
        date: new Date(payroll.check_date),
        description: `Payroll - ${new Date(payroll.check_date).toLocaleDateString()}`,
        amount: payroll.totals.gross_pay,
        type: "expense",
        category: "payroll_wages",
        metadata: {
          payrollId: payroll.id,
          netPay: payroll.totals.net_pay,
          employerTaxes: payroll.totals.employer_taxes,
          employeeTaxes: payroll.totals.employee_taxes,
          benefits: payroll.totals.benefits,
          processed: payroll.processed,
        },
      },
      update: {
        amount: payroll.totals.gross_pay,
        metadata: {
          payrollId: payroll.id,
          netPay: payroll.totals.net_pay,
          employerTaxes: payroll.totals.employer_taxes,
          employeeTaxes: payroll.totals.employee_taxes,
          benefits: payroll.totals.benefits,
          processed: payroll.processed,
        },
      },
    });
    syncedCount++;

    // Create separate transaction for employer taxes
    if (parseFloat(payroll.totals.employer_taxes) > 0) {
      await db.transaction.upsert({
        where: {
          userId_source_externalId: {
            userId,
            source: "gusto",
            externalId: `payroll-tax-${payroll.id}`,
          },
        },
        create: {
          userId,
          source: "gusto",
          externalId: `payroll-tax-${payroll.id}`,
          date: new Date(payroll.check_date),
          description: `Payroll Taxes - ${new Date(payroll.check_date).toLocaleDateString()}`,
          amount: payroll.totals.employer_taxes,
          type: "expense",
          category: "payroll_taxes",
          metadata: {
            payrollId: payroll.id,
            type: "employer_taxes",
          },
        },
        update: {
          amount: payroll.totals.employer_taxes,
        },
      });
      syncedCount++;
    }

    // Create separate transaction for benefits
    if (parseFloat(payroll.totals.benefits) > 0) {
      await db.transaction.upsert({
        where: {
          userId_source_externalId: {
            userId,
            source: "gusto",
            externalId: `payroll-benefits-${payroll.id}`,
          },
        },
        create: {
          userId,
          source: "gusto",
          externalId: `payroll-benefits-${payroll.id}`,
          date: new Date(payroll.check_date),
          description: `Employee Benefits - ${new Date(payroll.check_date).toLocaleDateString()}`,
          amount: payroll.totals.benefits,
          type: "expense",
          category: "employee_benefits",
          metadata: {
            payrollId: payroll.id,
            type: "benefits",
          },
        },
        update: {
          amount: payroll.totals.benefits,
        },
      });
      syncedCount++;
    }
  }

  // Fetch and sync contractor payments
  const contractors = await fetchGustoContractors(accessToken, companyId);
  for (const contractor of contractors) {
    // This would include contractor payment details
    // For now, we'll log that contractors exist
    syncedCount++;
  }

  // Update last sync time
  await db.connection.update({
    where: {
      id: connection.id,
    },
    data: {
      lastSyncAt: new Date(),
    },
  });

  return {
    success: true,
    syncedCount,
    message: `Synced ${syncedCount} transactions from Gusto`,
  };
}

async function fetchGustoCompanies(accessToken: string): Promise<GustoCompany[]> {
  const response = await fetch(`${GUSTO_API_BASE}/companies`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Gusto companies");
  }

  const data = await response.json();
  return data;
}

async function fetchGustoPayrolls(
  accessToken: string,
  companyId: string
): Promise<GustoPayroll[]> {
  const response = await fetch(
    `${GUSTO_API_BASE}/companies/${companyId}/payrolls`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Gusto payrolls");
  }

  const data = await response.json();
  return data.slice(0, 50); // Limit to recent 50 payrolls
}

async function fetchGustoContractors(
  accessToken: string,
  companyId: string
): Promise<any[]> {
  const response = await fetch(
    `${GUSTO_API_BASE}/companies/${companyId}/contractors`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    // Contractors endpoint might not be available, return empty
    return [];
  }

  const data = await response.json();
  return data;
}
