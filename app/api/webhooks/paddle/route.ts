import { NextRequest, NextResponse } from "next/server";
import { getPaddle } from "@/lib/paddle";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const paddle = getPaddle();
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET!;

    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get("paddle-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    try {
      const eventData = paddle.webhooks.unmarshal(body, webhookSecret, signature);

      // Handle different event types
      switch (eventData.eventType) {
        case "subscription.created": {
          const subscription = eventData.data;

          // Update subscription in database
          await db.subscription.upsert({
            where: {
              paddleSubscriptionId: subscription.id,
            },
            create: {
              userId: subscription.customData?.userId || "", // Must be passed in checkout
              paddleCustomerId: subscription.customerId,
              paddleSubscriptionId: subscription.id,
              paddlePriceId: subscription.items[0]?.price.id,
              status: subscription.status,
              currentPeriodEnd: subscription.currentBillingPeriod?.endsAt
                ? new Date(subscription.currentBillingPeriod.endsAt)
                : null,
            },
            update: {
              paddleCustomerId: subscription.customerId,
              paddlePriceId: subscription.items[0]?.price.id,
              status: subscription.status,
              currentPeriodEnd: subscription.currentBillingPeriod?.endsAt
                ? new Date(subscription.currentBillingPeriod.endsAt)
                : null,
            },
          });
          break;
        }

        case "subscription.updated": {
          const subscription = eventData.data;

          await db.subscription.update({
            where: {
              paddleSubscriptionId: subscription.id,
            },
            data: {
              status: subscription.status,
              paddlePriceId: subscription.items[0]?.price.id,
              currentPeriodEnd: subscription.currentBillingPeriod?.endsAt
                ? new Date(subscription.currentBillingPeriod.endsAt)
                : null,
              cancelAt: subscription.scheduledChange?.action === "cancel"
                ? new Date(subscription.scheduledChange.effectiveAt)
                : null,
            },
          });
          break;
        }

        case "subscription.activated": {
          const subscription = eventData.data;

          await db.subscription.update({
            where: {
              paddleSubscriptionId: subscription.id,
            },
            data: {
              status: "active",
              currentPeriodEnd: subscription.currentBillingPeriod?.endsAt
                ? new Date(subscription.currentBillingPeriod.endsAt)
                : null,
            },
          });
          break;
        }

        case "subscription.past_due": {
          const subscription = eventData.data;

          await db.subscription.update({
            where: {
              paddleSubscriptionId: subscription.id,
            },
            data: {
              status: "past_due",
            },
          });
          break;
        }

        case "subscription.paused": {
          const subscription = eventData.data;

          await db.subscription.update({
            where: {
              paddleSubscriptionId: subscription.id,
            },
            data: {
              status: "paused",
            },
          });
          break;
        }

        case "subscription.canceled": {
          const subscription = eventData.data;

          await db.subscription.update({
            where: {
              paddleSubscriptionId: subscription.id,
            },
            data: {
              status: "canceled",
              cancelAt: subscription.canceledAt
                ? new Date(subscription.canceledAt)
                : new Date(),
            },
          });
          break;
        }

        case "transaction.completed": {
          // Transaction completed successfully
          const transaction = eventData.data;
          console.log("Transaction completed:", transaction.id);
          break;
        }

        case "transaction.payment_failed": {
          // Payment failed
          const transaction = eventData.data;
          console.log("Payment failed:", transaction.id);
          break;
        }

        default:
          console.log(`Unhandled event type: ${eventData.eventType}`);
      }

      return NextResponse.json({ received: true });
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Disable body parser for webhooks
export const runtime = "nodejs";
