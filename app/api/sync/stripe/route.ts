import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { syncStripeData } from "@/lib/sync/stripe";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const result = await syncStripeData(user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Stripe sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync Stripe data",
      },
      { status: 500 }
    );
  }
}
