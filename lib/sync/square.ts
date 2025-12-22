import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

const SQUARE_API_BASE = process.env.SQUARE_ENVIRONMENT === "production"
  ? "https://connect.squareup.com/v2"
  : "https://connect.squareupsandbox.com/v2";

interface SquarePayment {
  id: string;
  created_at: string;
  amount_money: {
    amount: number;
    currency: string;
  };
  status: string;
  source_type: string;
  receipt_number?: string;
  note?: string;
}

interface SquareOrder {
  id: string;
  created_at: string;
  total_money: {
    amount: number;
    currency: string;
  };
  state: string;
  line_items: Array<{
    name: string;
    quantity: string;
  }>;
}

export async function syncSquareData(userId: string) {
  const connection = await db.connection.findUnique({
    where: {
      userId_source: {
        userId,
        source: "square",
      },
    },
  });

  if (!connection) {
    throw new Error("Square connection not found");
  }

  const accessToken = decrypt(connection.accessToken);
  const metadata = connection.metadata as any;
  const merchantId = metadata?.merchantId;

  if (!merchantId) {
    throw new Error("Square merchant ID not found in connection metadata");
  }

  let syncedCount = 0;

  // Fetch payments
  const payments = await fetchSquarePayments(accessToken);

  for (const payment of payments) {
    await db.transaction.upsert({
      where: {
        userId_source_externalId: {
          userId,
          source: "square",
          externalId: payment.id,
        },
      },
      create: {
        userId,
        source: "square",
        externalId: payment.id,
        date: new Date(payment.created_at),
        description: payment.note || `Square Payment - ${payment.receipt_number || payment.id}`,
        amount: (payment.amount_money.amount / 100).toString(),
        type: "income",
        category: "square_payment",
        metadata: {
          currency: payment.amount_money.currency,
          status: payment.status,
          sourceType: payment.source_type,
          receiptNumber: payment.receipt_number,
        },
      },
      update: {
        amount: (payment.amount_money.amount / 100).toString(),
        metadata: {
          currency: payment.amount_money.currency,
          status: payment.status,
          sourceType: payment.source_type,
          receiptNumber: payment.receipt_number,
        },
      },
    });
    syncedCount++;
  }

  // Fetch orders
  const orders = await fetchSquareOrders(accessToken);

  for (const order of orders) {
    // Only sync completed orders
    if (order.state !== "COMPLETED") continue;

    const itemNames = order.line_items?.map(item => item.name).join(", ") || "Order";

    await db.transaction.upsert({
      where: {
        userId_source_externalId: {
          userId,
          source: "square",
          externalId: order.id,
        },
      },
      create: {
        userId,
        source: "square",
        externalId: order.id,
        date: new Date(order.created_at),
        description: `Order: ${itemNames}`,
        amount: (order.total_money.amount / 100).toString(),
        type: "income",
        category: "square_order",
        metadata: {
          currency: order.total_money.currency,
          state: order.state,
          itemCount: order.line_items?.length || 0,
        },
      },
      update: {
        amount: (order.total_money.amount / 100).toString(),
        metadata: {
          currency: order.total_money.currency,
          state: order.state,
          itemCount: order.line_items?.length || 0,
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
    message: `Synced ${syncedCount} transactions from Square`,
  };
}

async function fetchSquarePayments(accessToken: string): Promise<SquarePayment[]> {
  const response = await fetch(`${SQUARE_API_BASE}/payments`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": "2024-12-18",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Square payments");
  }

  const data = await response.json();
  return (data.payments || []).slice(0, 100); // Limit to 100 for MVP
}

async function fetchSquareOrders(accessToken: string): Promise<SquareOrder[]> {
  const response = await fetch(`${SQUARE_API_BASE}/orders/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": "2024-12-18",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      limit: 100,
      query: {
        filter: {
          state_filter: {
            states: ["COMPLETED"],
          },
        },
        sort: {
          sort_field: "CREATED_AT",
          sort_order: "DESC",
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Square orders");
  }

  const data = await response.json();
  return data.orders || [];
}
