import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

const XERO_API_BASE = "https://api.xero.com/api.xro/2.0";

interface XeroTransaction {
  BankTransactionID: string;
  Date: string;
  Reference: string;
  Total: number;
  Type: "SPEND" | "RECEIVE";
  LineItems: Array<{
    Description: string;
    AccountCode: string;
  }>;
}

interface XeroInvoice {
  InvoiceID: string;
  Date: string;
  DueDate: string;
  Reference: string;
  Total: number;
  Type: "ACCREC" | "ACCPAY";
  Status: string;
  Contact: {
    Name: string;
  };
}

export async function syncXeroData(userId: string) {
  const connection = await db.connection.findUnique({
    where: {
      userId_source: {
        userId,
        source: "xero",
      },
    },
  });

  if (!connection) {
    throw new Error("Xero connection not found");
  }

  const accessToken = decrypt(connection.accessToken);

  // Get tenant ID first
  const tenantId = await getXeroTenantId(accessToken);

  let syncedCount = 0;

  // Fetch bank transactions
  const bankTransactions = await fetchXeroBankTransactions(accessToken, tenantId);

  for (const txn of bankTransactions) {
    const description = txn.LineItems[0]?.Description || txn.Reference || "Bank transaction";

    await db.transaction.upsert({
      where: {
        userId_source_externalId: {
          userId,
          source: "xero",
          externalId: txn.BankTransactionID,
        },
      },
      create: {
        userId,
        source: "xero",
        externalId: txn.BankTransactionID,
        date: new Date(txn.Date),
        description,
        amount: Math.abs(txn.Total).toString(),
        type: txn.Type === "RECEIVE" ? "income" : "expense",
        category: txn.LineItems[0]?.AccountCode || null,
        metadata: {
          reference: txn.Reference,
          accountCode: txn.LineItems[0]?.AccountCode,
        },
      },
      update: {
        date: new Date(txn.Date),
        description,
        amount: Math.abs(txn.Total).toString(),
        metadata: {
          reference: txn.Reference,
          accountCode: txn.LineItems[0]?.AccountCode,
        },
      },
    });
    syncedCount++;
  }

  // Fetch invoices
  const invoices = await fetchXeroInvoices(accessToken, tenantId);

  for (const invoice of invoices) {
    // Only sync paid invoices
    if (invoice.Status !== "PAID") continue;

    await db.transaction.upsert({
      where: {
        userId_source_externalId: {
          userId,
          source: "xero",
          externalId: invoice.InvoiceID,
        },
      },
      create: {
        userId,
        source: "xero",
        externalId: invoice.InvoiceID,
        date: new Date(invoice.Date),
        description: `Invoice: ${invoice.Contact.Name} - ${invoice.Reference || ""}`,
        amount: Math.abs(invoice.Total).toString(),
        type: invoice.Type === "ACCREC" ? "income" : "expense",
        category: invoice.Type === "ACCREC" ? "invoice_revenue" : "invoice_expense",
        metadata: {
          invoiceType: invoice.Type,
          contactName: invoice.Contact.Name,
          reference: invoice.Reference,
          dueDate: invoice.DueDate,
          status: invoice.Status,
        },
      },
      update: {
        amount: Math.abs(invoice.Total).toString(),
        metadata: {
          invoiceType: invoice.Type,
          contactName: invoice.Contact.Name,
          reference: invoice.Reference,
          dueDate: invoice.DueDate,
          status: invoice.Status,
        },
      },
    });
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
    message: `Synced ${syncedCount} transactions from Xero`,
  };
}

async function getXeroTenantId(accessToken: string): Promise<string> {
  const response = await fetch("https://api.xero.com/connections", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Xero tenant ID");
  }

  const tenants = await response.json();
  if (!tenants || tenants.length === 0) {
    throw new Error("No Xero tenants found");
  }

  return tenants[0].tenantId;
}

async function fetchXeroBankTransactions(
  accessToken: string,
  tenantId: string
): Promise<XeroTransaction[]> {
  const response = await fetch(`${XERO_API_BASE}/BankTransactions`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "xero-tenant-id": tenantId,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Xero bank transactions");
  }

  const data = await response.json();
  return (data.BankTransactions || []).slice(0, 100); // Limit to 100 for MVP
}

async function fetchXeroInvoices(
  accessToken: string,
  tenantId: string
): Promise<XeroInvoice[]> {
  const response = await fetch(`${XERO_API_BASE}/Invoices`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "xero-tenant-id": tenantId,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Xero invoices");
  }

  const data = await response.json();
  return (data.Invoices || []).slice(0, 100); // Limit to 100 for MVP
}
