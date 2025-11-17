import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { RequestContext } from "../types";
import { gameSearchHandler } from "./game-search-handler";

vi.unmock("@/data-access-layer/services/igdb/igdb-service");

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
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function createMockContext(ip: string = "127.0.0.1"): RequestContext {
  return {
    ip,
    headers: new Headers({ "x-forwarded-for": ip }),
    url: new URL("http://localhost/api/games/search"),
  };
}

describe("gameSearchHandler Integration Tests", () => {
  let testCounter = 0;

  function getUniqueIP(): string {
    testCounter++;
    return `192.168.${Math.floor(testCounter / 256)}.${testCounter % 256}`;
  }

  describe("when user searches for a game", () => {
    it("should return games when valid query is provided", async () => {
      const context = createMockContext(getUniqueIP());
      const result = await gameSearchHandler(
        { query: "zelda", offset: 0 },
        context
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.status).toBe(200);
        expect(result.data.games.length).toBeGreaterThan(0);
        expect(result.data.games[0]).toHaveProperty("id");
        expect(result.data.games[0]).toHaveProperty("name");
        expect(result.data.games[0]).toHaveProperty("cover");
        expect(result.data.games[0]).toHaveProperty("platforms");
        expect(result.data.games[0]).toHaveProperty("first_release_date");
      }
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

      const context = createMockContext(getUniqueIP());
      const result = await gameSearchHandler(
        { query: "zelda", offset: 20 },
        context
      );

      expect(result.success).toBe(true);
      expect(capturedBody).toContain('search "zelda"');
      expect(capturedBody).toContain("offset 20");
      expect(capturedBody).toContain("limit 10");
      if (result.success) {
        expect(result.data.games).toHaveLength(1);
      }
    });

    it("should handle special characters in query", async () => {
      const context = createMockContext(getUniqueIP());
      const result = await gameSearchHandler(
        { query: "mario & luigi", offset: 0 },
        context
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty("games");
      }
    });

    it("should handle long query strings", async () => {
      const context = createMockContext(getUniqueIP());
      const result = await gameSearchHandler(
        { query: "a".repeat(200), offset: 0 },
        context
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty("games");
      }
    });

    it("should handle large offset values", async () => {
      const context = createMockContext(getUniqueIP());
      const result = await gameSearchHandler(
        { query: "zelda", offset: 1000 },
        context
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty("games");
      }
    });

    it("should handle empty IGDB response gracefully", async () => {
      server.use(
        http.post("https://api.igdb.com/v4/games", () => {
          return HttpResponse.json([]);
        })
      );

      const context = createMockContext(getUniqueIP());
      const result = await gameSearchHandler(
        { query: "nonexistentgame12345", offset: 0 },
        context
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.games).toEqual([]);
        expect(result.data.count).toBe(0);
      }
    });
  });

  describe("when user encounters rate limiting", () => {
    it("should return 429 after exceeding rate limit", async () => {
      const ip = getUniqueIP();
      const context = createMockContext(ip);

      for (let i = 0; i < 20; i++) {
        const result = await gameSearchHandler(
          { query: "zelda", offset: 0 },
          context
        );
        expect(result.success).toBe(true);
      }

      const result = await gameSearchHandler(
        { query: "zelda", offset: 0 },
        context
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(429);
        expect(result.error).toBe("Rate limit exceeded. Try again later.");
      }
    });
  });

  describe("when IGDB service has issues", () => {
    it("should return 500 when IGDB API is unavailable", async () => {
      server.use(
        http.post("https://api.igdb.com/v4/games", () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const context = createMockContext(getUniqueIP());
      const result = await gameSearchHandler(
        { query: "zelda", offset: 0 },
        context
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(500);
        expect(result.error).toBeTruthy();
      }
    });
  });
});
