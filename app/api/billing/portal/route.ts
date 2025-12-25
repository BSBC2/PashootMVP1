import { NextRequest, NextResponse } from "next/server";
import { getPaddle } from "@/lib/paddle";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const paddle = getPaddle();

    // Get user's subscription
    const subscription = await db.subscription.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!subscription || !subscription.paddleSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Get Paddle subscription to access management URL
    const paddleSubscription = await paddle.subscriptions.get(subscription.paddleSubscriptionId);

    // Paddle doesn't have a billing portal API like Stripe
    // Instead, customers manage subscriptions via the update payment method URL
    // or by canceling through your app which calls Paddle API

    // For now, return the management URLs
    return NextResponse.json({
      managementUrls: paddleSubscription.managementUrls,
      updatePaymentMethod: paddleSubscription.managementUrls?.updatePaymentMethod,
      cancel: paddleSubscription.managementUrls?.cancel,
    });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription management URLs" },
      { status: 500 }
    );
  }
}
