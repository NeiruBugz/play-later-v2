import { env } from "@/env.mjs";

import { TOKEN_EXPIRY_SAFETY_MARGIN_SECONDS } from "@/shared/constants";
import { createLogger, getTimeStamp, LOGGER_CONTEXT } from "@/shared/lib";
import type { TwitchTokenResponse } from "@/shared/types";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "igdb-token" });

let cached: { token: string; expiresAt: number } | null = null;
let inFlight: Promise<string> | null = null;

async function refresh(): Promise<string> {
  const params = new URLSearchParams({
    client_id: env.IGDB_CLIENT_ID,
    client_secret: env.IGDB_CLIENT_SECRET,
    grant_type: "client_credentials",
  });
  const tokenUrl = `https://id.twitch.tv/oauth2/token?${params.toString()}`;

  const res = await fetch(tokenUrl, { method: "POST" });

  if (!res.ok) {
    logger.error(
      { status: res.status, statusText: res.statusText },
      "Failed to fetch Twitch access token"
    );
    throw new Error(`Failed to obtain Twitch access token: ${res.statusText}`);
  }

  const data = (await res.json()) as unknown as TwitchTokenResponse;
  const expiresAt =
    getTimeStamp() + data.expires_in - TOKEN_EXPIRY_SAFETY_MARGIN_SECONDS;

  cached = { token: data.access_token, expiresAt };
  logger.debug("Twitch access token refreshed");

  return data.access_token;
}

export async function getAccessToken(): Promise<string> {
  if (cached && getTimeStamp() < cached.expiresAt) {
    return cached.token;
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = refresh().finally(() => {
    inFlight = null;
  });

  try {
    return await inFlight;
  } catch (thrown) {
    logger.error({ error: thrown }, "Error obtaining Twitch access token");
    throw thrown instanceof Error
      ? thrown
      : new Error(`Failed to obtain Twitch access token: ${String(thrown)}`);
  }
}

export function forceRefresh(): void {
  cached = null;
}

export function __resetTokenCacheForTests(): void {
  cached = null;
  inFlight = null;
}
