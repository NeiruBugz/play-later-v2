/**
 * Twitch (IGDB) OAuth client-credentials token cache.
 *
 * Module-level singleton. Single-flight dedup via `inFlight` so 10 concurrent
 * cold-cache callers all share one Twitch fetch. Failures are NOT cached —
 * a rejected refresh leaves `cached === null` so the next call retries.
 *
 * Time math is done in milliseconds against `Date.now()` directly. The 60-second
 * safety margin is internal to this file by design — do not lift it to
 * `@/shared/lib/constants` and do not introduce a `getTimeStamp` helper. The
 * unit test suite at `./token.unit.test.ts` controls time via `vi.spyOn(Date, "now")`
 * and pins this contract.
 */
import { env } from "@env";

import { createLogger } from "@/shared/lib";

const logger = createLogger({ service: "igdb-token" });

const TOKEN_EXPIRY_SAFETY_MARGIN_MS = 60 * 1000;

interface CachedToken {
  token: string;
  /** Absolute expiry timestamp in milliseconds. */
  expiresAt: number;
}

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cached: CachedToken | null = null;
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

  const data = (await res.json()) as TwitchTokenResponse;
  const expiresAt =
    Date.now() + data.expires_in * 1000 - TOKEN_EXPIRY_SAFETY_MARGIN_MS;

  cached = { token: data.access_token, expiresAt };
  logger.debug("Twitch access token refreshed");

  return data.access_token;
}

export async function getAccessToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) {
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
