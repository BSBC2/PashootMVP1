import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { buildAuthUrl, exchangeCodeForTokens, saveConnection } from "@/lib/oauth-helpers";

const GUSTO_AUTH_URL = "https://api.gusto.com/oauth/authorize";
const GUSTO_TOKEN_URL = "https://api.gusto.com/oauth/token";
const GUSTO_SCOPES = ["companies.read", "payrolls.read", "employees.read", "contractors.read"];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      const user = await requireAuth();
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/gusto`;

      const authUrl = buildAuthUrl(
        GUSTO_AUTH_URL,
        process.env.GUSTO_CLIENT_ID!,
        redirectUri,
        GUSTO_SCOPES,
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

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/gusto`;
    const tokenData = await exchangeCodeForTokens(
      GUSTO_TOKEN_URL,
      process.env.GUSTO_CLIENT_ID!,
      process.env.GUSTO_CLIENT_SECRET!,
      code,
      redirectUri
    );

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : undefined;

    await saveConnection(user.id, "gusto", {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
      metadata: {
        tokenType: tokenData.token_type,
      },
    });

    // Trigger initial sync
    await fetch(`${process.env.NEXTAUTH_URL}/api/sync/gusto`, {
      method: "POST",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?success=gusto_connected`
    );
  } catch (error) {
    console.error("Gusto OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?error=gusto_failed`
    );
  }
}
