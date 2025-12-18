import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

const WAVE_GRAPHQL_URL = "https://gql.waveapps.com/graphql/public";

interface WaveTransaction {
  id: string;
  date: string;
  description: string;
  amount: {
    value: string;
    currency: string;
  };
  direction: "DEPOSIT" | "WITHDRAWAL";
}

export async function syncWaveData(userId: string) {
  // Get connection
  const connection = await db.connection.findUnique({
    where: {
      userId_source: {
        userId,
        source: "wave",
      },
    },
  });

  if (!connection) {
    throw new Error("Wave connection not found");
  }

  const accessToken = decrypt(connection.accessToken);

  // Get business ID first
  const businessId = await getWaveBusinessId(accessToken);

  // Fetch transactions
  const transactions = await fetchWaveTransactions(accessToken, businessId);

  // Transform and save transactions
  let syncedCount = 0;
  for (const transaction of transactions) {
    await db.transaction.upsert({
      where: {
        userId_source_externalId: {
          userId,
          source: "wave",
          externalId: transaction.id,
        },
      },
      create: {
        userId,
        source: "wave",
        externalId: transaction.id,
        date: new Date(transaction.date),
        description: transaction.description,
        amount: transaction.amount.value,
        type: transaction.direction === "DEPOSIT" ? "income" : "expense",
        category: null, // TODO: Add category mapping
        metadata: {
          currency: transaction.amount.currency,
          direction: transaction.direction,
        },
      },
      update: {
        date: new Date(transaction.date),
        description: transaction.description,
        amount: transaction.amount.value,
        metadata: {
          currency: transaction.amount.currency,
          direction: transaction.direction,
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
    message: `Synced ${syncedCount} transactions from Wave`,
  };
}

async function getWaveBusinessId(accessToken: string): Promise<string> {
  const query = `
    query {
      user {
        defaultBusiness {
          id
        }
      }
    }
  `;

  const response = await fetch(WAVE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Wave business ID");
  }

  const data = await response.json();
  return data.data.user.defaultBusiness.id;
}

async function fetchWaveTransactions(
  accessToken: string,
  businessId: string
): Promise<WaveTransaction[]> {
  const query = `
    query($businessId: ID!, $page: Int!) {
      business(id: $businessId) {
        transactions(page: $page, pageSize: 50) {
          pageInfo {
            currentPage
            totalPages
          }
          edges {
            node {
              id
              date
              description
              amount {
                value
                currency {
                  code
                }
              }
              direction
            }
          }
        }
      }
    }
  `;

  const allTransactions: WaveTransaction[] = [];
  let currentPage = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const response = await fetch(WAVE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { businessId, page: currentPage },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Wave transactions");
    }

    const data = await response.json();
    const transactions = data.data.business.transactions.edges.map(
      (edge: any) => ({
        id: edge.node.id,
        date: edge.node.date,
        description: edge.node.description,
        amount: {
          value: edge.node.amount.value,
          currency: edge.node.amount.currency.code,
        },
        direction: edge.node.direction,
      })
    );

    allTransactions.push(...transactions);

    const pageInfo = data.data.business.transactions.pageInfo;
    hasMorePages = currentPage < pageInfo.totalPages;
    currentPage++;

    // Limit to first 100 transactions for MVP
    if (allTransactions.length >= 100) {
      break;
    }
  }

  return allTransactions;
}
