import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: any;
}

export async function saveConnection(
  userId: string,
  source: string,
  tokens: OAuthTokens
) {
  const encryptedAccessToken = encrypt(tokens.accessToken);
  const encryptedRefreshToken = tokens.refreshToken
    ? encrypt(tokens.refreshToken)
    : null;

  return await db.connection.upsert({
    where: {
      userId_source: {
        userId,
        source,
      },
    },
    create: {
      userId,
      source,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: tokens.expiresAt,
      metadata: tokens.metadata,
    },
    update: {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: tokens.expiresAt,
      metadata: tokens.metadata,
      updatedAt: new Date(),
    },
  });
}

export function buildAuthUrl(
  baseUrl: string,
  clientId: string,
  redirectUri: string,
  scopes: string[],
  state?: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(" "),
    response_type: "code",
    ...(state && { state }),
  });

  return `${baseUrl}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<any> {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return await response.json();
}
