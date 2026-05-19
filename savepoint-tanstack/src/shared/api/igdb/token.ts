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
 *
 * Error tracing: on a failed refresh we read the Twitch JSON body once
 * (`{ status, message }`) and attach it to the thrown error so prod logs
 * carry the actual reason ("invalid client", "missing client_id", …) rather
 * than just the HTTP status text.
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

interface TwitchErrorBody {
  status?: number;
  message?: string;
}

let cached: CachedToken | null = null;
let inFlight: Promise<string> | null = null;

async function readTwitchError(
  res: Response
): Promise<{ message?: string; bodySnippet?: string }> {
  const raw = await res.text().catch(() => "");
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as TwitchErrorBody;
    return { message: parsed.message, bodySnippet: raw };
  } catch {
    return { bodySnippet: raw };
  }
}

async function refresh(): Promise<string> {
  const params = new URLSearchParams({
    client_id: env.IGDB_CLIENT_ID,
    client_secret: env.IGDB_CLIENT_SECRET,
    grant_type: "client_credentials",
  });
  const tokenUrl = `https://id.twitch.tv/oauth2/token?${params.toString()}`;

  const res = await fetch(tokenUrl, { method: "POST" });

  if (!res.ok) {
    const { message, bodySnippet } = await readTwitchError(res);
    logger.error(
      {
        status: res.status,
        statusText: res.statusText,
        twitchMessage: message,
        bodySnippet,
      },
      "Failed to fetch Twitch access token"
    );
    throw new Error(
      `Failed to obtain Twitch access token: ${res.status} ${
        message ?? res.statusText ?? ""
      }`.trim()
    );
  }

  const data = (await res.json()) as TwitchTokenResponse;
  const expiresAt =
    Date.now() + data.expires_in * 1000 - TOKEN_EXPIRY_SAFETY_MARGIN_MS;

  cached = { token: data.access_token, expiresAt };
  logger.debug({ expiresAt }, "Twitch access token refreshed");

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
    logger.error({ err: thrown }, "Error obtaining Twitch access token");
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
