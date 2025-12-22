import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

const NOTION_API_VERSION = "2022-06-28";
const NOTION_API_BASE = "https://api.notion.com/v1";

interface NotionPage {
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: {
    [key: string]: any;
  };
}

export async function syncNotionData(userId: string) {
  const connection = await db.connection.findUnique({
    where: {
      userId_source: {
        userId,
        source: "notion",
      },
    },
  });

  if (!connection) {
    throw new Error("Notion connection not found");
  }

  const accessToken = decrypt(connection.accessToken);

  // Get database ID from metadata (configured during OAuth)
  const metadata = connection.metadata as any;
  const databaseId = metadata?.databaseId;

  if (!databaseId) {
    throw new Error("Notion database ID not found. Please reconnect and select a database.");
  }

  let syncedCount = 0;

  // Fetch database pages
  const pages = await fetchNotionDatabasePages(accessToken, databaseId);

  for (const page of pages) {
    // Extract data from Notion properties
    const date = extractNotionDate(page.properties);
    const amount = extractNotionAmount(page.properties);
    const description = extractNotionDescription(page.properties);
    const type = extractNotionType(page.properties);

    // Only sync if we have minimum required fields
    if (!date || !amount || !description) {
      continue;
    }

    await db.transaction.upsert({
      where: {
        userId_source_externalId: {
          userId,
          source: "notion",
          externalId: page.id,
        },
      },
      create: {
        userId,
        source: "notion",
        externalId: page.id,
        date: new Date(date),
        description,
        amount: Math.abs(amount).toString(),
        type: type || "expense",
        category: extractNotionCategory(page.properties) || "notion_record",
        metadata: {
          databaseId,
          pageUrl: `https://notion.so/${page.id.replace(/-/g, "")}`,
          properties: page.properties,
        },
      },
      update: {
        date: new Date(date),
        description,
        amount: Math.abs(amount).toString(),
        type: type || "expense",
        metadata: {
          databaseId,
          pageUrl: `https://notion.so/${page.id.replace(/-/g, "")}`,
          properties: page.properties,
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
    message: `Synced ${syncedCount} pages from Notion`,
  };
}

async function fetchNotionDatabasePages(
  accessToken: string,
  databaseId: string
): Promise<NotionPage[]> {
  const response = await fetch(`${NOTION_API_BASE}/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Notion-Version": NOTION_API_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      page_size: 100,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Notion database pages");
  }

  const data = await response.json();
  return data.results || [];
}

// Helper functions to extract data from Notion properties
function extractNotionDate(properties: any): string | null {
  // Try common date property names
  const dateProps = ["Date", "date", "Transaction Date", "Created"];
  for (const prop of dateProps) {
    if (properties[prop]) {
      const propData = properties[prop];
      if (propData.type === "date" && propData.date?.start) {
        return propData.date.start;
      }
    }
  }

  // Fallback to created_time
  return null;
}

function extractNotionAmount(properties: any): number | null {
  // Try common amount property names
  const amountProps = ["Amount", "amount", "Total", "Price", "Cost", "Value"];
  for (const prop of amountProps) {
    if (properties[prop]) {
      const propData = properties[prop];
      if (propData.type === "number" && propData.number !== null) {
        return propData.number;
      }
    }
  }
  return null;
}

function extractNotionDescription(properties: any): string | null {
  // Try common description property names
  const descProps = ["Name", "name", "Title", "title", "Description", "Notes"];
  for (const prop of descProps) {
    if (properties[prop]) {
      const propData = properties[prop];

      // Handle title type
      if (propData.type === "title" && propData.title?.[0]?.plain_text) {
        return propData.title[0].plain_text;
      }

      // Handle rich_text type
      if (propData.type === "rich_text" && propData.rich_text?.[0]?.plain_text) {
        return propData.rich_text[0].plain_text;
      }
    }
  }

  // Fallback: try to find any title or rich_text property
  for (const key in properties) {
    const propData = properties[key];
    if (propData.type === "title" && propData.title?.[0]?.plain_text) {
      return propData.title[0].plain_text;
    }
  }

  return "Notion Page";
}

function extractNotionType(properties: any): "income" | "expense" | null {
  // Try to find a type/category property
  const typeProps = ["Type", "type", "Category", "category"];
  for (const prop of typeProps) {
    if (properties[prop]) {
      const propData = properties[prop];

      // Handle select type
      if (propData.type === "select" && propData.select?.name) {
        const value = propData.select.name.toLowerCase();
        if (value.includes("income") || value.includes("revenue")) {
          return "income";
        }
        if (value.includes("expense") || value.includes("cost")) {
          return "expense";
        }
      }

      // Handle rich_text type
      if (propData.type === "rich_text" && propData.rich_text?.[0]?.plain_text) {
        const value = propData.rich_text[0].plain_text.toLowerCase();
        if (value.includes("income") || value.includes("revenue")) {
          return "income";
        }
        if (value.includes("expense") || value.includes("cost")) {
          return "expense";
        }
      }
    }
  }

  // Check if amount is negative (expense) or positive (income)
  const amount = extractNotionAmount(properties);
  if (amount !== null) {
    return amount < 0 ? "expense" : "income";
  }

  return null;
}

function extractNotionCategory(properties: any): string | null {
  // Try to find a category property
  const categoryProps = ["Category", "category", "Type", "type"];
  for (const prop of categoryProps) {
    if (properties[prop]) {
      const propData = properties[prop];

      // Handle select type
      if (propData.type === "select" && propData.select?.name) {
        return propData.select.name;
      }

      // Handle multi_select type
      if (propData.type === "multi_select" && propData.multi_select?.[0]?.name) {
        return propData.multi_select[0].name;
      }
    }
  }

  return null;
}
