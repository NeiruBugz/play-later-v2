/**
 * Contract: token.ts reads `Date.now()` for expiry checks.
 * Do NOT introduce a `getTimeStamp` helper in @/shared/lib —
 * control time here with vi.spyOn(Date, "now").
 *
 * Note: vitest.config.ts only fakes ["setTimeout", "clearTimeout"].
 * Date.now() is NOT faked by vi.useFakeTimers(); use spyOn instead.
 *
 * TOKEN_EXPIRY_SAFETY_MARGIN_SECONDS = 60 is internal to token.ts;
 * tests hard-code 60 where needed.
 */

import {
  __resetTokenCacheForTests,
  forceRefresh,
  getAccessToken,
} from "./token";

vi.mock("@env", () => ({
  env: {
    IGDB_CLIENT_ID: "test-client-id",
    IGDB_CLIENT_SECRET: "test-client-secret",
  },
}));

vi.mock("@/shared/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/lib")>();
  return {
    ...actual,
    createLogger: vi.fn(() => ({
      fatal: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      child: vi.fn(),
    })),
  };
});

const MOCK_TOKEN = "mock-access-token";
const EXPIRES_IN = 3600;

function makeTwitchFetchMock(token = MOCK_TOKEN, expiresIn = EXPIRES_IN) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      access_token: token,
      expires_in: expiresIn,
      token_type: "bearer",
    }),
  });
}

describe("getAccessToken", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    __resetTokenCacheForTests();
    mockFetch = makeTwitchFetchMock();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches a Twitch token on the first call and returns it", async () => {
    const token = await getAccessToken();

    expect(token).toBe(MOCK_TOKEN);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("id.twitch.tv/oauth2/token"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("returns the cached token without re-fetching within the expiry window", async () => {
    await getAccessToken();
    const secondToken = await getAccessToken();

    expect(secondToken).toBe(MOCK_TOKEN);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("refreshes the token after the expiry window passes", async () => {
    // Date.now() returns milliseconds; token.ts uses it directly.
    // We advance to (start + expires_in - 60 + 1) seconds to cross the
    // safety margin boundary (hard-coded 60s in token.ts).
    const startMs = 1_000_000_000;
    const dateSpy = vi.spyOn(Date, "now").mockReturnValue(startMs);

    await getAccessToken();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance past expiresAt: startMs/1000 + EXPIRES_IN - 60 + 1 seconds
    // = startMs + (EXPIRES_IN - 60 + 1) * 1000 ms
    const safetyMargin = 60; // TOKEN_EXPIRY_SAFETY_MARGIN_SECONDS
    const expiredMs = startMs + (EXPIRES_IN - safetyMargin + 1) * 1000;
    dateSpy.mockReturnValue(expiredMs);

    await getAccessToken();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("single-flight: 10 concurrent cold-cache calls result in exactly one Twitch fetch", async () => {
    let resolveToken!: () => void;
    const delayedFetch = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveToken = () =>
          resolve({
            ok: true,
            json: async () => ({
              access_token: MOCK_TOKEN,
              expires_in: EXPIRES_IN,
              token_type: "bearer",
            }),
          } as unknown as Response);
      })
    );
    vi.stubGlobal("fetch", delayedFetch);

    const promises = Array.from({ length: 10 }, () => getAccessToken());

    resolveToken();

    const tokens = await Promise.all(promises);

    expect(delayedFetch).toHaveBeenCalledTimes(1);
    for (const t of tokens) {
      expect(t).toBe(MOCK_TOKEN);
    }
  });

  it("allows a retry after a fetch failure instead of caching the rejection", async () => {
    const failFetch = vi.fn().mockRejectedValueOnce(new Error("network down"));
    vi.stubGlobal("fetch", failFetch);

    await expect(getAccessToken()).rejects.toThrow(/network down/);

    failFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: MOCK_TOKEN,
        expires_in: EXPIRES_IN,
        token_type: "bearer",
      }),
    });

    const token = await getAccessToken();
    expect(token).toBe(MOCK_TOKEN);
    expect(failFetch).toHaveBeenCalledTimes(2);
  });

  it("forceRefresh causes the next call to re-fetch even within the expiry window", async () => {
    await getAccessToken();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    forceRefresh();

    const secondFetch = makeTwitchFetchMock("refreshed-token");
    vi.stubGlobal("fetch", secondFetch);

    const token = await getAccessToken();
    expect(token).toBe("refreshed-token");
    expect(secondFetch).toHaveBeenCalledTimes(1);
  });
});
