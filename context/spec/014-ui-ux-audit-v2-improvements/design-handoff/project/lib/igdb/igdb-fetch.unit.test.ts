import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import {
  IgdbAuthError,
  IgdbHttpError,
  IgdbNetworkError,
  IgdbRateLimitError,
} from "./errors";
import { igdbFetch } from "./igdb-fetch";
import { __resetTokenCacheForTests } from "./token";

vi.mock("@/env.mjs", () => ({
  env: {
    IGDB_CLIENT_ID: "test-client-id",
    IGDB_CLIENT_SECRET: "test-client-secret",
  },
}));

vi.mock("@/shared/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/lib")>();
  const mockLogger = {
    fatal: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
  };
  return {
    ...actual,
    createLogger: vi.fn(() => mockLogger),
    LOGGER_CONTEXT: { SERVICE: "service" },
    getTimeStamp: vi.fn(() => Math.floor(Date.now() / 1000)),
  };
});

vi.mock("@/shared/constants", () => ({
  TOKEN_EXPIRY_SAFETY_MARGIN_SECONDS: 60,
}));

// Mock the limiter as a transparent pass-through so Bottleneck's internal
// timers don't conflict with vi.useFakeTimers().
vi.mock("./limiter", () => ({
  igdbLimiter: {
    schedule: (fn: () => unknown) => fn(),
    queued: () => 0,
    running: () => 0,
  },
  __resetLimiterForTests: vi.fn(),
}));

const IGDB_GAMES_URL = "https://api.igdb.com/v4/games";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";

function twitchHandler() {
  return http.post(TWITCH_TOKEN_URL, () =>
    HttpResponse.json({
      access_token: "test-token",
      expires_in: 5_000_000,
      token_type: "bearer",
    })
  );
}

const server = setupServer(twitchHandler());

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

describe("igdbFetch", () => {
  beforeEach(() => {
    __resetTokenCacheForTests();
    vi.useFakeTimers();
    server.resetHandlers();
    server.use(twitchHandler());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("happy path: resolves with parsed JSON on 200", async () => {
    let callCount = 0;
    server.use(
      http.post(IGDB_GAMES_URL, () => {
        callCount++;
        return HttpResponse.json([{ id: 1 }]);
      })
    );

    const promise = igdbFetch<{ id: number }[]>("/games", "fields id;");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual([{ id: 1 }]);
    expect(callCount).toBe(1);
  });

  it("retries on 429 with Retry-After and eventually succeeds", async () => {
    let callCount = 0;
    server.use(
      http.post(IGDB_GAMES_URL, () => {
        callCount++;
        if (callCount <= 2) {
          return new HttpResponse(null, {
            status: 429,
            headers: { "Retry-After": "1" },
          });
        }
        return HttpResponse.json([{ id: 1 }]);
      })
    );

    const promise = igdbFetch("/games", "fields id;");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual([{ id: 1 }]);
    expect(callCount).toBeGreaterThanOrEqual(3);
  });

  it("retries on 503 and eventually succeeds", async () => {
    let callCount = 0;
    server.use(
      http.post(IGDB_GAMES_URL, () => {
        callCount++;
        if (callCount <= 2) {
          return new HttpResponse(null, { status: 503 });
        }
        return HttpResponse.json([{ id: 1 }]);
      })
    );

    const promise = igdbFetch("/games", "fields id;");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual([{ id: 1 }]);
    expect(callCount).toBe(3);
  });

  it("retries on network error and eventually succeeds", async () => {
    let callCount = 0;
    server.use(
      http.post(IGDB_GAMES_URL, () => {
        callCount++;
        if (callCount <= 2) {
          return HttpResponse.error();
        }
        return HttpResponse.json([{ id: 1 }]);
      })
    );

    const promise = igdbFetch("/games", "fields id;");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual([{ id: 1 }]);
    expect(callCount).toBe(3);
  });

  it("exhausts retries on 429 and rejects with IgdbRateLimitError", async () => {
    server.use(
      http.post(
        IGDB_GAMES_URL,
        () =>
          new HttpResponse(null, {
            status: 429,
            headers: { "Retry-After": "1" },
          })
      )
    );

    // Attach .catch immediately to prevent unhandled rejection during timer advance.
    const errorPromise = igdbFetch("/games", "fields id;").catch(
      (e: unknown) => e
    );
    await vi.runAllTimersAsync();

    const error = await errorPromise;
    expect(error).toBeInstanceOf(IgdbRateLimitError);
    expect(error).toMatchObject({ retryAfterMs: expect.any(Number) });
  });

  it("does NOT retry on 400 and rejects with IgdbHttpError after exactly 1 call", async () => {
    let callCount = 0;
    server.use(
      http.post(IGDB_GAMES_URL, () => {
        callCount++;
        return new HttpResponse(null, { status: 400 });
      })
    );

    // Attach .catch before any async yield to prevent unhandled rejection.
    const promise = igdbFetch("/games", "fields id;");
    const error = await promise.catch((e: unknown) => e);
    await vi.runAllTimersAsync();

    expect(error).toBeInstanceOf(IgdbHttpError);
    expect(callCount).toBe(1);
  });

  it("does NOT retry on 403 and rejects with IgdbAuthError after exactly 1 call", async () => {
    let callCount = 0;
    server.use(
      http.post(IGDB_GAMES_URL, () => {
        callCount++;
        return new HttpResponse(null, { status: 403 });
      })
    );

    const promise = igdbFetch("/games", "fields id;");
    const error = await promise.catch((e: unknown) => e);
    await vi.runAllTimersAsync();

    expect(error).toBeInstanceOf(IgdbAuthError);
    expect(callCount).toBe(1);
  });

  it("401: one-shot token refresh then succeeds on the retry", async () => {
    let igdbCallCount = 0;
    let twitchCallCount = 0;

    server.use(
      http.post(TWITCH_TOKEN_URL, () => {
        twitchCallCount++;
        return HttpResponse.json({
          access_token: `token-${twitchCallCount}`,
          expires_in: 5_000_000,
          token_type: "bearer",
        });
      }),
      http.post(IGDB_GAMES_URL, () => {
        igdbCallCount++;
        if (igdbCallCount === 1) {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json([{ id: 42 }]);
      })
    );

    const promise = igdbFetch("/games", "fields id;");
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual([{ id: 42 }]);
    expect(igdbCallCount).toBe(2);
    expect(twitchCallCount).toBe(2);
  });

  it("401 double-fail: rejects with IgdbAuthError after exactly 2 IGDB calls (no infinite loop)", async () => {
    let igdbCallCount = 0;

    server.use(
      http.post(IGDB_GAMES_URL, () => {
        igdbCallCount++;
        return new HttpResponse(null, { status: 401 });
      })
    );

    const errorPromise = igdbFetch("/games", "fields id;").catch(
      (e: unknown) => e
    );
    await vi.runAllTimersAsync();

    const error = await errorPromise;
    expect(error).toBeInstanceOf(IgdbAuthError);
    expect(error).toMatchObject({ status: 401 });
    expect(igdbCallCount).toBe(2);
  });

  it("timeout: rejects with IgdbNetworkError when the AbortSignal.timeout fires", async () => {
    // AbortSignal.timeout() uses Node's internal timers not controlled by
    // vi.useFakeTimers(). Use real timers for this test by temporarily restoring
    // them, and stub AbortSignal.timeout to return a pre-aborted signal so the
    // fetch sees an immediate timeout without real elapsed time.
    vi.useRealTimers();

    const abortedSignal = AbortSignal.abort(
      new DOMException("signal timed out", "TimeoutError")
    );
    const timeoutSpy = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(abortedSignal);

    // MSW handler that would hang — won't matter since the signal aborts first.
    server.use(
      http.post(IGDB_GAMES_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 30_000));
        return HttpResponse.json([]);
      })
    );

    const error = await igdbFetch("/games", "fields id;").catch(
      (e: unknown) => e
    );

    expect(error).toBeInstanceOf(IgdbNetworkError);
    timeoutSpy.mockRestore();
    vi.useFakeTimers();
  });

  it("user-abort: rejects with IgdbNetworkError when caller aborts, no retry", async () => {
    // Abort synchronously before the fetch completes. The key invariant is
    // IgdbNetworkError (not IgdbRateLimitError or IgdbServerError) and that
    // the retry loop does NOT fire (no subsequent IGDB calls).
    let igdbCallCount = 0;
    const controller = new AbortController();

    server.use(
      http.post(IGDB_GAMES_URL, async () => {
        igdbCallCount++;
        return HttpResponse.json([]);
      })
    );

    // Abort before awaiting so the signal is already aborted when fetch runs.
    controller.abort();

    const error = await igdbFetch("/games", "fields id;", {
      signal: controller.signal,
    }).catch((e: unknown) => e);

    await vi.runAllTimersAsync();

    expect(error).toBeInstanceOf(IgdbNetworkError);
    // MSW may or may not have entered the handler before the abort propagated;
    // what must NOT happen is a retry (which would produce count > 1).
    expect(igdbCallCount).toBeLessThanOrEqual(1);
  });
});
