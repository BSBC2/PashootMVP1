import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { buildAuthUrl, exchangeCodeForTokens, saveConnection } from "@/lib/oauth-helpers";

const WAVE_AUTH_URL = "https://api.waveapps.com/oauth2/authorize/";
const WAVE_TOKEN_URL = "https://api.waveapps.com/oauth2/token/";
const WAVE_SCOPES = ["business:read", "business:write"];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    // If no code, redirect to Wave authorization
    if (!code) {
      const user = await requireAuth();
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/wave`;

      const authUrl = buildAuthUrl(
        WAVE_AUTH_URL,
        process.env.WAVE_CLIENT_ID!,
        redirectUri,
        WAVE_SCOPES,
        user.id // Use userId as state for verification
      );

      return NextResponse.redirect(authUrl);
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

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/wave`;
    const tokenData = await exchangeCodeForTokens(
      WAVE_TOKEN_URL,
      process.env.WAVE_CLIENT_ID!,
      process.env.WAVE_CLIENT_SECRET!,
      code,
      redirectUri
    );

    // Calculate expiration
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : undefined;

    // Save connection
    await saveConnection(user.id, "wave", {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
    });

    // Trigger initial sync
    await fetch(`${process.env.NEXTAUTH_URL}/api/sync/wave`, {
      method: "POST",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?success=wave_connected`
    );
  } catch (error) {
    console.error("Wave OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?error=wave_failed`
    );
  }
}
