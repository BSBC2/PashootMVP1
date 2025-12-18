import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { buildAuthUrl, exchangeCodeForTokens, saveConnection } from "@/lib/oauth-helpers";

const XERO_AUTH_URL = "https://login.xero.com/identity/connect/authorize";
const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_SCOPES = ["accounting.transactions.read", "accounting.contacts.read", "accounting.settings.read"];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      const user = await requireAuth();
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/xero`;

      const authUrl = buildAuthUrl(
        XERO_AUTH_URL,
        process.env.XERO_CLIENT_ID!,
        redirectUri,
        XERO_SCOPES,
        user.id
      );

      return NextResponse.redirect(authUrl);
    }

    const user = await requireAuth();
    const state = searchParams.get("state");

    if (state !== user.id) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/connections?error=invalid_state`
      );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/xero`;
    const tokenData = await exchangeCodeForTokens(
      XERO_TOKEN_URL,
      process.env.XERO_CLIENT_ID!,
      process.env.XERO_CLIENT_SECRET!,
      code,
      redirectUri
    );

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : undefined;

    await saveConnection(user.id, "xero", {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?success=xero_connected`
    );
  } catch (error) {
    console.error("Xero OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?error=xero_failed`
    );
  }
}
