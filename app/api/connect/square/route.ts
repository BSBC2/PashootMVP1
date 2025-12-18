import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { saveConnection } from "@/lib/oauth-helpers";

const SQUARE_AUTH_URL = "https://connect.squareup.com/oauth2/authorize";
const SQUARE_TOKEN_URL = "https://connect.squareup.com/oauth2/token";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      const user = await requireAuth();
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/square`;

      const params = new URLSearchParams({
        client_id: process.env.SQUARE_CLIENT_ID!,
        redirect_uri: redirectUri,
        scope: "PAYMENTS_READ ORDERS_READ CUSTOMERS_READ",
        state: user.id,
      });

      return NextResponse.redirect(`${SQUARE_AUTH_URL}?${params.toString()}`);
    }

    const user = await requireAuth();
    const state = searchParams.get("state");

    if (state !== user.id) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/connections?error=invalid_state`
      );
    }

    const response = await fetch(SQUARE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Square-Version": "2024-12-18",
      },
      body: JSON.stringify({
        client_id: process.env.SQUARE_CLIENT_ID,
        client_secret: process.env.SQUARE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = await response.json();

    const expiresAt = tokenData.expires_at
      ? new Date(tokenData.expires_at)
      : undefined;

    await saveConnection(user.id, "square", {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
      metadata: {
        merchantId: tokenData.merchant_id,
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?success=square_connected`
    );
  } catch (error) {
    console.error("Square OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?error=square_failed`
    );
  }
}
