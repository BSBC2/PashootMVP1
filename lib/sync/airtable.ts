import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: {
    [key: string]: any;
  };
}

export async function syncAirtableData(userId: string) {
  const connection = await db.connection.findUnique({
    where: {
      userId_source: {
        userId,
        source: "airtable",
      },
    },
  });

  if (!connection) {
    throw new Error("Airtable connection not found");
  }

  const accessToken = decrypt(connection.accessToken);

  // Get base and table from metadata (would be configured during OAuth)
  const metadata = connection.metadata as any;
  const baseId = metadata?.baseId;
  const tableId = metadata?.tableId || "Expenses"; // Default table name

  if (!baseId) {
    throw new Error("Airtable base ID not found. Please reconnect.");
  }

  let syncedCount = 0;

  // Fetch records from Airtable
  const records = await fetchAirtableRecords(accessToken, baseId, tableId);

  for (const record of records) {
    // Try to extract financial data from common field names
    // This is flexible since Airtable schemas vary by user
    const date = extractDate(record.fields);
    const amount = extractAmount(record.fields);
    const description = extractDescription(record.fields);
    const type = extractType(record.fields);

    // Only sync if we have minimum required fields
    if (!date || !amount || !description) {
      continue;
    }

    await db.transaction.upsert({
      where: {
        userId_source_externalId: {
          userId,
          source: "airtable",
          externalId: record.id,
        },
      },
      create: {
        userId,
        source: "airtable",
        externalId: record.id,
        date: new Date(date),
        description,
        amount: Math.abs(amount).toString(),
        type: type || "expense",
        category: record.fields.Category || record.fields.Type || "airtable_record",
        metadata: {
          baseId,
          tableId,
          fields: record.fields,
        },
      },
      update: {
        date: new Date(date),
        description,
        amount: Math.abs(amount).toString(),
        type: type || "expense",
        metadata: {
          baseId,
          tableId,
          fields: record.fields,
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
    message: `Synced ${syncedCount} records from Airtable`,
  };
}

async function fetchAirtableRecords(
  accessToken: string,
  baseId: string,
  tableId: string
): Promise<AirtableRecord[]> {
  const response = await fetch(
    `${AIRTABLE_API_BASE}/${baseId}/${encodeURIComponent(tableId)}?maxRecords=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Airtable records");
  }

  const data = await response.json();
  return data.records || [];
}

// Helper functions to extract data from flexible Airtable schemas
function extractDate(fields: any): string | null {
  // Try common date field names
  const dateFields = ["Date", "date", "Transaction Date", "Created", "createdTime"];
  for (const field of dateFields) {
    if (fields[field]) {
      return fields[field];
    }
  }
  return null;
}

function extractAmount(fields: any): number | null {
  // Try common amount field names
  const amountFields = ["Amount", "amount", "Total", "Price", "Cost", "Value"];
  for (const field of amountFields) {
    if (fields[field] !== undefined && fields[field] !== null) {
      const num = parseFloat(fields[field]);
      if (!isNaN(num)) {
        return num;
      }
    }
  }
  return null;
}

function extractDescription(fields: any): string | null {
  // Try common description field names
  const descFields = [
    "Description",
    "description",
    "Name",
    "name",
    "Title",
    "Notes",
    "Memo",
  ];
  for (const field of descFields) {
    if (fields[field]) {
      return String(fields[field]);
    }
  }

  // Fallback: use first string field
  for (const key in fields) {
    if (typeof fields[key] === "string" && fields[key].length > 0) {
      return fields[key];
    }
  }

  return "Airtable Record";
}

function extractType(fields: any): "income" | "expense" | null {
  // Try to determine if it's income or expense
  const typeField = fields.Type || fields.type || fields.Category || fields.category;

  if (typeof typeField === "string") {
    const lower = typeField.toLowerCase();
    if (lower.includes("income") || lower.includes("revenue") || lower.includes("payment received")) {
      return "income";
    }
    if (lower.includes("expense") || lower.includes("cost") || lower.includes("payment made")) {
      return "expense";
    }
  }

  // Check if amount is negative (expense) or positive (income)
  const amount = extractAmount(fields);
  if (amount !== null) {
    return amount < 0 ? "expense" : "income";
  }

  return null;
}
