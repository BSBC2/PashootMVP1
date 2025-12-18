import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { buildAuthUrl, exchangeCodeForTokens, saveConnection } from "@/lib/oauth-helpers";

const AIRTABLE_AUTH_URL = "https://airtable.com/oauth2/v1/authorize";
const AIRTABLE_TOKEN_URL = "https://airtable.com/oauth2/v1/token";
const AIRTABLE_SCOPES = ["data.records:read", "schema.bases:read"];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      const user = await requireAuth();
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/airtable`;

      const authUrl = buildAuthUrl(
        AIRTABLE_AUTH_URL,
        process.env.AIRTABLE_CLIENT_ID!,
        redirectUri,
        AIRTABLE_SCOPES,
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

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/airtable`;
    const tokenData = await exchangeCodeForTokens(
      AIRTABLE_TOKEN_URL,
      process.env.AIRTABLE_CLIENT_ID!,
      process.env.AIRTABLE_CLIENT_SECRET!,
      code,
      redirectUri
    );

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : undefined;

    await saveConnection(user.id, "airtable", {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?success=airtable_connected`
    );
  } catch (error) {
    console.error("Airtable OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?error=airtable_failed`
    );
  }
}
