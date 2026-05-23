/**
 * Internal IGDB REST helper. Single attempt, no retry, no Bottleneck.
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
import { getAccessToken } from "./token";

const logger = createLogger({ service: "igdb-fetch" });

const IGDB_BASE_URL = "https://api.igdb.com/v4";

export async function igdbFetch(
  resource: string,
  body: string
): Promise<unknown> {
  const requestId = crypto.randomUUID();
  const callLogger = logger.child({ requestId, resource });
  const startedAt = Date.now();

  callLogger.debug({ query: body }, "IGDB request start");

  const token = await getAccessToken();

  const res = await fetch(`${IGDB_BASE_URL}${resource}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Client-ID": env.IGDB_CLIENT_ID,
    },
    body,
  });

  const durationMs = Date.now() - startedAt;
  const cfRay = res.headers?.get("cf-ray") ?? undefined;
  const xRequestId = res.headers?.get("x-request-id") ?? undefined;

  if (!res.ok) {
    const raw =
      typeof res.text === "function" ? await res.text().catch(() => "") : "";
    const envelope = parseIgdbErrorBody(raw);

    const context: IgdbHttpErrorContext = {
      status: res.status,
      statusText: res.statusText,
      resource,
      query: body,
      requestId,
      cfRay,
      xRequestId,
      ...envelope,
    };

    callLogger.error(
      { ...context, durationMs },
      `IGDB request failed: ${res.status} ${envelope.igdbTitle ?? res.statusText ?? ""}`.trim()
    );

    throw new IgdbHttpError(
      `IGDB ${res.status} ${envelope.igdbTitle ?? res.statusText ?? ""}`.trim(),
      context
    );
  }

  callLogger.debug({ durationMs, cfRay }, "IGDB request ok");

  return res.json();
}
