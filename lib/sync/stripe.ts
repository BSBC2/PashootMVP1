import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import Stripe from "stripe";

export async function syncStripeData(userId: string) {
  // Get connection
  const connection = await db.connection.findUnique({
    where: {
      userId_source: {
        userId,
        source: "stripe",
      },
    },
  });

  if (!connection) {
    throw new Error("Stripe connection not found");
  }

  const accessToken = decrypt(connection.accessToken);
  const stripe = new Stripe(accessToken, {
    apiVersion: "2025-02-24.acacia",
  });

  let syncedCount = 0;

  // Fetch charges (payments)
  const charges = await stripe.charges.list({ limit: 100 });

  for (const charge of charges.data) {
    // Extract customer ID - handle both string and object types
    const customerId = typeof charge.customer === 'string'
      ? charge.customer
      : charge.customer?.id || null;

    await db.transaction.upsert({
      where: {
        userId_source_externalId: {
          userId,
          source: "stripe",
          externalId: charge.id,
        },
      },
      create: {
        userId,
        source: "stripe",
        externalId: charge.id,
        date: new Date(charge.created * 1000),
        description: charge.description || `Charge from ${charge.billing_details.name || "customer"}`,
        amount: (charge.amount / 100).toString(),
        type: charge.refunded ? "transfer" : "income",
        category: "stripe_payment",
        metadata: {
          currency: charge.currency,
          status: charge.status,
          customerId,
          paymentMethod: charge.payment_method_details?.type,
        },
      },
      update: {
        description: charge.description || `Charge from ${charge.billing_details.name || "customer"}`,
        amount: (charge.amount / 100).toString(),
        metadata: {
          currency: charge.currency,
          status: charge.status,
          customerId,
          paymentMethod: charge.payment_method_details?.type,
        },
      },
    });
    syncedCount++;
  }

  // Fetch balance transactions (includes fees)
  const balanceTransactions = await stripe.balanceTransactions.list({ limit: 100 });

  for (const txn of balanceTransactions.data) {
    // Skip if this is a charge we already synced
    if (txn.type === "charge") continue;

    await db.transaction.upsert({
      where: {
        userId_source_externalId: {
          userId,
          source: "stripe",
          externalId: txn.id,
        },
      },
      create: {
        userId,
        source: "stripe",
        externalId: txn.id,
        date: new Date(txn.created * 1000),
        description: `${txn.type}: ${txn.description || "Stripe transaction"}`,
        amount: (txn.amount / 100).toString(),
        type: txn.type.includes("refund") || txn.type.includes("fee") ? "expense" : "income",
        category: `stripe_${txn.type}`,
        metadata: {
          currency: txn.currency,
          fee: txn.fee / 100,
          net: txn.net / 100,
          type: txn.type,
        },
      },
      update: {
        description: `${txn.type}: ${txn.description || "Stripe transaction"}`,
        amount: (txn.amount / 100).toString(),
        metadata: {
          currency: txn.currency,
          fee: txn.fee / 100,
          net: txn.net / 100,
          type: txn.type,
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
    message: `Synced ${syncedCount} transactions from Stripe`,
  };
}
