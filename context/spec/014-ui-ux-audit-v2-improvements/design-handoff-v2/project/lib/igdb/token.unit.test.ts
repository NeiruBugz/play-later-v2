import {
  __resetTokenCacheForTests,
  forceRefresh,
  getAccessToken,
} from "./token";

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
    vi.useFakeTimers();
    mockFetch = makeTwitchFetchMock();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
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
    const { getTimeStamp } = await import("@/shared/lib");
    const getTimeStampMock = getTimeStamp as ReturnType<typeof vi.fn>;

    const startTime = 1_000_000;
    getTimeStampMock.mockReturnValue(startTime);

    await getAccessToken();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const safetyMargin = 60;
    getTimeStampMock.mockReturnValue(startTime + EXPIRES_IN - safetyMargin + 1);

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
    await vi.runAllTimersAsync();

    const tokens = await Promise.all(promises);

    expect(delayedFetch).toHaveBeenCalledTimes(1);
    for (const t of tokens) {
      expect(t).toBe(MOCK_TOKEN);
    }
  });

  it("allows a retry after a fetch failure instead of caching the rejection", async () => {
    const failFetch = vi.fn().mockRejectedValueOnce(new Error("network down"));
    vi.stubGlobal("fetch", failFetch);

    await expect(getAccessToken()).rejects.toThrow("network down");

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
