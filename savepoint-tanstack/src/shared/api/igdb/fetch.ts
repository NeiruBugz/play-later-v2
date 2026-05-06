/**
 * Internal IGDB REST helper. Single attempt, no retry, no Bottleneck. Failure
 * surfaces as a plain `Error`; callers (e.g. `searchGames`) wrap into
 * `UpstreamError` so the public surface stays uniform. Uses `globalThis.fetch`
 * so tests can `vi.stubGlobal("fetch", ...)`.
 */
import { env } from "@env";

import { createLogger } from "@/shared/lib";

import { getAccessToken } from "./token";

const logger = createLogger({ service: "igdb-fetch" });

const IGDB_BASE_URL = "https://api.igdb.com/v4";

export async function igdbFetch(
  resource: string,
  body: string
): Promise<unknown> {
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

  if (!res.ok) {
    logger.error(
      { status: res.status, statusText: res.statusText, resource },
      "IGDB request failed"
    );
    throw new Error(
      `IGDB request failed: ${res.status} ${res.statusText ?? ""}`.trim()
    );
  }

  return res.json();
}
