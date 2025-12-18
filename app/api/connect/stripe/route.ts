import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { saveConnection } from "@/lib/oauth-helpers";

const STRIPE_CONNECT_AUTH_URL = "https://connect.stripe.com/oauth/authorize";
const STRIPE_CONNECT_TOKEN_URL = "https://connect.stripe.com/oauth/token";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    // If no code, redirect to Stripe Connect authorization
    if (!code) {
      const user = await requireAuth();
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/stripe`;

      const params = new URLSearchParams({
        client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "read_only",
        state: user.id,
      });

      return NextResponse.redirect(`${STRIPE_CONNECT_AUTH_URL}?${params.toString()}`);
    }

    // Handle callback with code
    const user = await requireAuth();
    const state = searchParams.get("state");

    // Verify state matches userId
    if (state !== user.id) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/connections?error=invalid_state`
      );
    }

    // Exchange code for access token
    const response = await fetch(STRIPE_CONNECT_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
        client_secret: process.env.STRIPE_SECRET_KEY!,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = await response.json();

    // Save connection with Stripe account ID in metadata
    await saveConnection(user.id, "stripe", {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      metadata: {
        stripeUserId: tokenData.stripe_user_id,
        scope: tokenData.scope,
      },
    });

    // Trigger initial sync
    await fetch(`${process.env.NEXTAUTH_URL}/api/sync/stripe`, {
      method: "POST",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?success=stripe_connected`
    );
  } catch (error) {
    console.error("Stripe Connect OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?error=stripe_failed`
    );
  }
}
