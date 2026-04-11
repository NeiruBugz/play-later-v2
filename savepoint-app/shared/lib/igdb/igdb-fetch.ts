import { env } from "@/env.mjs";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import {
  IgdbAuthError,
  IgdbHttpError,
  IgdbNetworkError,
  IgdbRateLimitError,
  IgdbServerError,
} from "./errors";
import { igdbLimiter } from "./limiter";
import { forceRefresh, getAccessToken } from "./token";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "igdb-fetch" });

const IGDB_BASE_URL = "https://api.igdb.com/v4";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 200;
const MAX_DELAY_MS = 5000;
const TIMEOUT_MS = 8000;

function computeBackoff(attempt: number): number {
  return Math.random() * Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt);
}

function parseRetryAfterMs(header: string | null): number | undefined {
  if (!header) return undefined;

  const seconds = Number(header);
  if (!Number.isNaN(seconds)) {
    return seconds * 1000;
  }

  const parsed = Date.parse(header);
  if (!Number.isNaN(parsed)) {
    return Math.max(0, parsed - Date.now());
  }

  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUserAbort(error: unknown, userSignal?: AbortSignal): boolean {
  return (
    error instanceof Error &&
    error.name === "AbortError" &&
    userSignal?.aborted === true
  );
}

type IgdbFetchInit = {
  signal?: AbortSignal;
  _retryCount?: number;
  _didTokenRefresh?: boolean;
};

async function igdbFetchInner<T = unknown>(
  resource: string,
  body: string,
  init?: IgdbFetchInit
): Promise<T> {
  const attempt = init?._retryCount ?? 0;
  const userSignal = init?.signal;

  const timeoutSignal = AbortSignal.timeout(TIMEOUT_MS);
  const signal =
    userSignal !== undefined
      ? AbortSignal.any([userSignal, timeoutSignal])
      : timeoutSignal;

  let token: string;
  try {
    token = await getAccessToken();
  } catch (error) {
    throw new IgdbAuthError("Failed to obtain IGDB access token", {
      cause: error,
      attempt,
    });
  }

  logger.debug({ resource, attempt }, "IGDB fetch attempt");

  let response: Response;
  try {
    response = await fetch(`${IGDB_BASE_URL}${resource}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Client-ID": env.IGDB_CLIENT_ID,
      },
      body,
      signal,
    });
  } catch (fetchError) {
    if (isUserAbort(fetchError, userSignal)) {
      throw new IgdbNetworkError("Request aborted by caller", {
        cause: fetchError,
        attempt,
      });
    }

    const networkError = new IgdbNetworkError(
      "Network error during IGDB request",
      { cause: fetchError, attempt }
    );

    if (attempt < MAX_RETRIES) {
      const delayMs = computeBackoff(attempt);
      logger.warn(
        { resource, attempt, delayMs, reason: "network-error" },
        "Retrying IGDB request after network error"
      );
      await sleep(delayMs);
      return igdbFetchInner<T>(resource, body, {
        ...init,
        _retryCount: attempt + 1,
      });
    }

    logger.error(
      { resource, attempt, error: fetchError },
      "IGDB request failed after max retries (network)"
    );
    throw networkError;
  }

  if (response.status === 401) {
    if (!init?._didTokenRefresh) {
      forceRefresh();
      return igdbFetchInner<T>(resource, body, {
        ...init,
        _didTokenRefresh: true,
      });
    }
    throw new IgdbAuthError("IGDB request unauthorized after token refresh", {
      status: 401,
      attempt,
    });
  }

  if (response.status === 403) {
    throw new IgdbAuthError("IGDB request forbidden", {
      status: 403,
      attempt,
    });
  }

  if (response.status === 429) {
    const retryAfterMs = parseRetryAfterMs(response.headers.get("Retry-After"));

    if (attempt < MAX_RETRIES) {
      const backoff = computeBackoff(attempt);
      const delayMs =
        retryAfterMs !== undefined ? Math.max(retryAfterMs, backoff) : backoff;

      logger.warn(
        { resource, attempt, delayMs, reason: "rate-limited" },
        "Retrying IGDB request after rate limit"
      );
      await sleep(delayMs);
      return igdbFetchInner<T>(resource, body, {
        ...init,
        _retryCount: attempt + 1,
      });
    }

    logger.error(
      { resource, attempt },
      "IGDB request failed after max retries (rate limited)"
    );
    throw new IgdbRateLimitError("IGDB rate limit exceeded", {
      status: 429,
      attempt,
      retryAfterMs,
    });
  }

  if (response.status >= 500) {
    if (attempt < MAX_RETRIES) {
      const delayMs = computeBackoff(attempt);
      logger.warn(
        {
          resource,
          attempt,
          delayMs,
          status: response.status,
          reason: "server-error",
        },
        "Retrying IGDB request after server error"
      );
      await sleep(delayMs);
      return igdbFetchInner<T>(resource, body, {
        ...init,
        _retryCount: attempt + 1,
      });
    }

    logger.error(
      { resource, attempt, status: response.status },
      "IGDB request failed after max retries (server error)"
    );
    throw new IgdbServerError(
      `IGDB server error: ${response.status} ${response.statusText}`,
      { status: response.status, attempt }
    );
  }

  if (!response.ok) {
    throw new IgdbHttpError(
      `IGDB HTTP error: ${response.status} ${response.statusText}`,
      { status: response.status, attempt }
    );
  }

  try {
    return (await response.json()) as T;
  } catch (parseError) {
    throw new IgdbNetworkError("Failed to parse IGDB response JSON", {
      cause: parseError,
      attempt,
    });
  }
}

export async function igdbFetch<T = unknown>(
  resource: string,
  body: string,
  init?: {
    signal?: AbortSignal;
  }
): Promise<T> {
  logger.debug(
    { queued: igdbLimiter.queued(), running: igdbLimiter.running() },
    "IGDB limiter queue state"
  );
  return igdbLimiter.schedule(() => igdbFetchInner<T>(resource, body, init));
}
