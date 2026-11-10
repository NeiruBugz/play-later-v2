/**
 * Internal IGDB REST helper. Every response goes through `igdbResponseCache`.
 * One recovery retry: a 401 refreshes the Twitch token, a 429 waits
 * 300–600 ms. Each attempt is bounded by an 8 s abort signal.
 *
 * On non-2xx, reads the response body once, parses IGDB's `[{ title, status,
 * cause }]` envelope when present, and throws `IgdbHttpError` carrying the
 * lifted fields plus the apicalypse query we sent + a per-call `requestId`.
 * Public callers (`searchGames`, `getGameByIgdbId`, …) re-throw as
 * `UpstreamError` and lift this context for the route boundary.
 *
 * Verbosity: dev gets full request/response traces via `logger.debug`
 * (auto-stripped in prod by the pino level). Warn/error always log the IGDB
 * envelope so prod triage is never blind.
 *
 * Uses `globalThis.fetch` so tests can `vi.stubGlobal("fetch", ...)`.
 */
import { env } from "@env";

import { createLogger } from "@/shared/lib";

import {
  IgdbHttpError,
  parseIgdbErrorBody,
  type IgdbHttpErrorContext,
} from "./errors";
import { igdbResponseCache } from "./response-cache";
import { forceRefresh, getAccessToken } from "./token";

const logger = createLogger({ service: "igdb-fetch" });

const IGDB_BASE_URL = "https://api.igdb.com/v4";
const IGDB_TIMEOUT_MS = 8_000;
const RATE_LIMIT_RETRY_MIN_DELAY_MS = 300;
const RATE_LIMIT_RETRY_JITTER_MS = 300;

export async function igdbFetch(
  resource: string,
  body: string
): Promise<unknown> {
  return igdbResponseCache.getOrLoad(`${resource}\n${body}`, () =>
    fetchWithRecovery(resource, body)
  );
}

async function fetchWithRecovery(
  resource: string,
  body: string
): Promise<unknown> {
  const requestId = crypto.randomUUID();
  const callLogger = logger.child({ requestId, resource });
  const startedAt = Date.now();

  callLogger.debug({ query: body }, "IGDB request start");

  let res = await sendOnce(resource, body);

  if (res.status === 401) {
    callLogger.warn("IGDB rejected the access token; refreshing and retrying");
    forceRefresh();
    res = await sendOnce(resource, body);
  } else if (res.status === 429) {
    callLogger.warn("IGDB rate limit hit; retrying once after a delay");
    await waitForRateLimitRetry();
    res = await sendOnce(resource, body);
  }

  const durationMs = Date.now() - startedAt;

  if (!res.ok) {
    const error = await toIgdbHttpError(res, { resource, body, requestId });
    callLogger.error(
      { ...error.context, durationMs },
      `IGDB request failed: ${error.message}`
    );
    throw error;
  }

  callLogger.debug(
    { durationMs, cfRay: res.headers?.get("cf-ray") ?? undefined },
    "IGDB request ok"
  );

  return res.json();
}

async function sendOnce(resource: string, body: string): Promise<Response> {
  const token = await getAccessToken();

  return fetch(`${IGDB_BASE_URL}${resource}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Client-ID": env.IGDB_CLIENT_ID,
    },
    body,
    signal: AbortSignal.timeout(IGDB_TIMEOUT_MS),
  });
}

function waitForRateLimitRetry(): Promise<void> {
  const delayMs =
    RATE_LIMIT_RETRY_MIN_DELAY_MS + Math.random() * RATE_LIMIT_RETRY_JITTER_MS;
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function toIgdbHttpError(
  res: Response,
  call: { resource: string; body: string; requestId: string }
): Promise<IgdbHttpError> {
  const raw =
    typeof res.text === "function" ? await res.text().catch(() => "") : "";
  const envelope = parseIgdbErrorBody(raw);

  const context: IgdbHttpErrorContext = {
    status: res.status,
    statusText: res.statusText,
    resource: call.resource,
    query: call.body,
    requestId: call.requestId,
    cfRay: res.headers?.get("cf-ray") ?? undefined,
    xRequestId: res.headers?.get("x-request-id") ?? undefined,
    ...envelope,
  };

  return new IgdbHttpError(
    `IGDB ${res.status} ${envelope.igdbTitle ?? res.statusText ?? ""}`.trim(),
    context
  );
}
