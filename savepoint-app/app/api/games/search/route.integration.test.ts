import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { NextRequest } from "next/server";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { GET } from "./route";

/**
 * Mock unstable_cache from next/cache to pass through to the actual function
 * This allows the tests to work while bypassing the cache during tests
 */
vi.mock("next/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/cache")>();
  return {
    ...actual,
    unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  };
});

/**
 * This test file uses MSW (Mock Service Worker) to intercept HTTP requests.
 * We need to unmock IgdbService to ensure the real service makes HTTP calls
 * that MSW can intercept. Other integration tests may mock IgdbService, and
 * because integration tests run in a single fork, those mocks can persist.
 */
vi.unmock("@/data-access-layer/services/igdb/igdb-service");

// Set up MSW server for HTTP mocking
const igdbHandlers = [
  http.post("https://id.twitch.tv/oauth2/token", () => {
    return HttpResponse.json({
      access_token: "mock-token",
      expires_in: 5000000,
      token_type: "bearer",
    });
  }),

  http.post("https://api.igdb.com/v4/games", async ({ request }) => {
    const body = await request.text();

    const searchMatch = body.match(/search\s+"([^"]+)"/);

    if (searchMatch && searchMatch[1]) {
      return HttpResponse.json([
        {
          id: 1,
          name: "The Legend of Zelda: Breath of the Wild",
          cover: { image_id: "co3p2d" },
          platforms: [{ name: "Nintendo Switch" }],
          first_release_date: 1488326400,
        },
        {
          id: 2,
          name: "The Legend of Zelda: Ocarina of Time",
          cover: { image_id: "co1234" },
          platforms: [{ name: "Nintendo 64" }],
          first_release_date: 911606400,
        },
      ]);
    }

    return HttpResponse.json([]);
  }),
];

const server = setupServer(...igdbHandlers);

beforeAll(() => {
  // Start MSW server with strict error handling to catch unhandled requests
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  // Reset any runtime handlers added during tests
  server.resetHandlers();
});

afterAll(() => {
  // Clean up and close the MSW server
  server.close();
});

function createMockRequest(
  searchParams: Record<string, string | undefined>,
  ip: string = "127.0.0.1"
): NextRequest {
  const url = new URL("http://localhost:6060/api/games/search");
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });

  return {
    ip,
    headers: new Headers({ "x-forwarded-for": ip }),
    nextUrl: url,
  } as unknown as NextRequest;
}

describe("GET /api/games/search", () => {
  let testCounter = 0;

  function getUniqueIP(): string {
    testCounter++;
    return `192.168.${Math.floor(testCounter / 256)}.${testCounter % 256}`;
  }

  describe("when user searches for a game", () => {
    it("should return games when valid query is provided", async () => {
      const request = createMockRequest({ q: "zelda" }, getUniqueIP());
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("games");
      expect(data).toHaveProperty("count");
      expect(Array.isArray(data.games)).toBe(true);
      expect(data.games.length).toBeGreaterThan(0);

      const game = data.games[0];
      expect(game).toHaveProperty("id");
      expect(game).toHaveProperty("name");
      expect(game).toHaveProperty("cover");
      expect(game).toHaveProperty("platforms");
      expect(game).toHaveProperty("first_release_date");
    });

    it("should validate minimum 3 characters", async () => {
      const request = createMockRequest({ q: "ze" }, getUniqueIP());
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid search parameters" });
    });

    it("should handle missing query parameter", async () => {
      const request = createMockRequest({}, getUniqueIP());
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid search parameters" });
    });

    it("should support pagination with offset", async () => {
      let capturedBody = "";

      server.use(
        http.post("https://api.igdb.com/v4/games", async ({ request }) => {
          capturedBody = await request.text();
          return HttpResponse.json([
            {
              id: 100,
              name: "Game from page 2",
              cover: { image_id: "test" },
              platforms: [{ name: "PC" }],
              first_release_date: 1234567890,
            },
          ]);
        })
      );

      const request = createMockRequest(
        { q: "zelda", offset: "20" },
        getUniqueIP()
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(capturedBody).toContain('search "zelda"');
      expect(capturedBody).toContain("offset 20");
      expect(capturedBody).toContain("limit 10");
      expect(data.games).toHaveLength(1);
    });

    it("should validate offset is non-negative", async () => {
      const request = createMockRequest(
        { q: "zelda", offset: "-1" },
        getUniqueIP()
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Invalid search parameters" });
    });

    it("should handle special characters in query", async () => {
      const request = createMockRequest({ q: "mario & luigi" }, getUniqueIP());
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("games");
    });

    it("should handle long query strings", async () => {
      const request = createMockRequest({ q: "a".repeat(200) }, getUniqueIP());
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("games");
    });

    it("should handle large offset values", async () => {
      const request = createMockRequest(
        { q: "zelda", offset: "1000" },
        getUniqueIP()
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("games");
    });

    it("should handle decimal offset by converting to integer", async () => {
      const request = createMockRequest(
        { q: "zelda", offset: "10.5" },
        getUniqueIP()
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("games");
    });
  });

  describe("when user encounters rate limiting", () => {
    it("should return 429 after exceeding rate limit", async () => {
      const ip = getUniqueIP();

      for (let i = 0; i < 20; i++) {
        const request = createMockRequest({ q: "zelda" }, ip);
        const response = await GET(request);
        expect(response.status).toBe(200);
      }

      const request = createMockRequest({ q: "zelda" }, ip);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("Rate limit exceeded. Try again later.");
    });
  });

  describe("when IGDB service has issues", () => {
    it("should return 500 when IGDB API is unavailable", async () => {
      server.use(
        http.post("https://api.igdb.com/v4/games", () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const request = createMockRequest({ q: "zelda" }, getUniqueIP());
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeTruthy();
    });

    it("should handle empty IGDB response gracefully", async () => {
      server.use(
        http.post("https://api.igdb.com/v4/games", () => {
          return HttpResponse.json([]);
        })
      );

      const request = createMockRequest(
        { q: "nonexistentgame12345" },
        getUniqueIP()
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.games).toEqual([]);
      expect(data.count).toBe(0);
    });
  });
});
