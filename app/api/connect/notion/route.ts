import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { saveConnection } from "@/lib/oauth-helpers";

const NOTION_AUTH_URL = "https://api.notion.com/v1/oauth/authorize";
const NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      const user = await requireAuth();
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/notion`;

      const params = new URLSearchParams({
        client_id: process.env.NOTION_CLIENT_ID!,
        redirect_uri: redirectUri,
        response_type: "code",
        owner: "user",
        state: user.id,
      });

      return NextResponse.redirect(`${NOTION_AUTH_URL}?${params.toString()}`);
    }

    const user = await requireAuth();
    const state = searchParams.get("state");

    if (state !== user.id) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/connections?error=invalid_state`
      );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/notion`;
    const auth = Buffer.from(
      `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
    ).toString("base64");

    const response = await fetch(NOTION_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = await response.json();

    await saveConnection(user.id, "notion", {
      accessToken: tokenData.access_token,
      metadata: {
        workspaceId: tokenData.workspace_id,
        workspaceName: tokenData.workspace_name,
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?success=notion_connected`
    );
  } catch (error) {
    console.error("Notion OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?error=notion_failed`
    );
  }
}
