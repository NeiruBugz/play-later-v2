/**
 * RED integration test for searchGames (Slice 8 — IGDB search worker).
 *
 * This test is intentionally failing: `@/shared/api/igdb` does not export
 * `searchGames` yet. The import will fail at module-resolution time — that is
 * the expected RED state. Do not implement production code in this file.
 *
 * HTTP is fully mocked via vi.stubGlobal("fetch", ...). No DB access.
 * Despite living under test/integration/, there is no setupIsolatedDatabase
 * call here — the "integration" project is the right home because this file
 * exercises the real (un-mocked) searchGames worker against mocked transport.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// RED imports — these modules do not exist until the GREEN step.
import { searchGames } from "@/shared/api/igdb";
import { __resetTokenCacheForTests } from "@/shared/api/igdb/token";
import { UpstreamError } from "@/shared/lib/errors";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const IGDB_GAMES_URL = "https://api.igdb.com/v4/games";

const FAKE_TOKEN_RESPONSE = {
  access_token: "tok",
  expires_in: 3600,
  token_type: "bearer",
};

// Minimum fields mirroring savepoint-app SearchResponseItemSchema.
const MOCK_IGDB_GAMES = [
  {
    id: 1234,
    name: "Celeste",
    slug: "celeste",
    cover: {
      id: 100,
      url: "//images.igdb.com/igdb/image/upload/t_cover_big/abc.jpg",
    },
    first_release_date: 1516924800,
    platforms: [{ id: 6, name: "PC (Microsoft Windows)" }],
  },
  {
    id: 5678,
    name: "Celeste Classic",
    slug: "celeste-classic",
    cover: null,
    first_release_date: 1448496000,
    platforms: [],
  },
];

// ---------------------------------------------------------------------------
// Fetch mock factory
// ---------------------------------------------------------------------------

/**
 * Build a fetch mock that routes Twitch token requests and IGDB requests
 * separately. Accepts overrides for each endpoint.
 */
function makeFetchMock({
  twitchResponse = {
    ok: true as boolean | undefined,
    status: 200,
    body: FAKE_TOKEN_RESPONSE,
  },
  igdbResponse = {
    ok: true as boolean | undefined,
    status: 200,
    body: MOCK_IGDB_GAMES as unknown,
  },
  igdbReject = undefined as Error | undefined,
}: {
  twitchResponse?: {
    ok?: boolean;
    status?: number;
    statusText?: string;
    body?: unknown;
  };
  igdbResponse?: {
    ok?: boolean;
    status?: number;
    statusText?: string;
    body?: unknown;
  };
  igdbReject?: Error;
} = {}) {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes("id.twitch.tv")) {
      return Promise.resolve({
        ok: twitchResponse.ok ?? true,
        status: twitchResponse.status ?? 200,
        statusText: twitchResponse.statusText ?? "OK",
        json: async () => twitchResponse.body,
      } as Response);
    }

    if (url.includes("api.igdb.com")) {
      if (igdbReject) {
        return Promise.reject(igdbReject);
      }
      return Promise.resolve({
        ok: igdbResponse.ok ?? true,
        status: igdbResponse.status ?? 200,
        statusText: igdbResponse.statusText ?? "OK",
        json: async () => igdbResponse.body,
      } as Response);
    }

    return Promise.reject(new Error(`Unexpected fetch URL in test: ${url}`));
  });
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  __resetTokenCacheForTests();
  mockFetch = makeFetchMock();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("searchGames", () => {
  describe("happy path", () => {
    it("returns parsed games array and matching count", async () => {
      const result = await searchGames({ name: "celeste" });

      expect(result.count).toBe(2);
      expect(Array.isArray(result.games)).toBe(true);
      expect(result.games).toHaveLength(2);
      // Verify the first mock game identity comes through.
      expect((result.games[0] as { id: number }).id).toBe(
        MOCK_IGDB_GAMES[0].id
      );

      // Exactly one POST to IGDB (token fetch is separate).
      const igdbCalls = mockFetch.mock.calls.filter(
        (args: unknown[]) => args[0] === IGDB_GAMES_URL
      );
      expect(igdbCalls).toHaveLength(1);
    });

    it("resolves with empty games and count 0 when IGDB returns an empty array", async () => {
      vi.stubGlobal(
        "fetch",
        makeFetchMock({ igdbResponse: { ok: true, status: 200, body: [] } })
      );

      const result = await searchGames({ name: "xyzzy-nonexistent" });

      expect(result.games).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe("upstream errors", () => {
    it("throws UpstreamError when IGDB returns HTTP 500", async () => {
      vi.stubGlobal(
        "fetch",
        makeFetchMock({
          igdbResponse: {
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            body: null,
          },
        })
      );

      await expect(searchGames({ name: "x" })).rejects.toBeInstanceOf(
        UpstreamError
      );
    });

    it("throws UpstreamError when fetch rejects due to a network failure", async () => {
      vi.stubGlobal(
        "fetch",
        makeFetchMock({
          igdbReject: new TypeError("fetch failed"),
        })
      );

      await expect(searchGames({ name: "x" })).rejects.toBeInstanceOf(
        UpstreamError
      );
    });

    it("throws UpstreamError when the Twitch token endpoint returns 401", async () => {
      vi.stubGlobal(
        "fetch",
        makeFetchMock({
          twitchResponse: {
            ok: false,
            status: 401,
            statusText: "Unauthorized",
            body: null,
          },
        })
      );

      await expect(searchGames({ name: "x" })).rejects.toBeInstanceOf(
        UpstreamError
      );
    });

    it("throws UpstreamError when IGDB returns 200 but malformed JSON (object instead of array)", async () => {
      vi.stubGlobal(
        "fetch",
        makeFetchMock({
          igdbResponse: {
            ok: true,
            status: 200,
            body: { error: "bad query" },
          },
        })
      );

      await expect(searchGames({ name: "x" })).rejects.toBeInstanceOf(
        UpstreamError
      );
    });
  });
});
