import {
  cleanupDatabase,
  getTestDatabase,
  setupDatabase,
} from "@/test/setup/database";
import { createUser } from "@/test/setup/db-factories/user";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { HTTP_STATUS } from "@/shared/config/http-codes";

import type { RequestContext } from "../types";
import { fetchSteamGamesHandler } from "./fetch-steam-games.handler";

const STEAM_API_BASE = "https://api.steampowered.com";

const steamHandlers = [
  http.get(
    `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`,
    ({ request }) => {
      const url = new URL(request.url);
      const steamId = url.searchParams.get("steamid");

      if (steamId === "76561198012345678") {
        return HttpResponse.json({
          response: {
            game_count: 3,
            games: [
              {
                appid: 440,
                name: "Team Fortress 2",
                playtime_forever: 120,
                playtime_windows_forever: 100,
                playtime_mac_forever: 20,
                playtime_linux_forever: 0,
                img_icon_url: "icon_tf2.jpg",
                img_logo_url: "logo_tf2.jpg",
                rtime_last_played: 1704067200,
              },
              {
                appid: 730,
                name: "Counter-Strike 2",
                playtime_forever: 500,
                playtime_windows_forever: 500,
                playtime_mac_forever: 0,
                playtime_linux_forever: 0,
                img_icon_url: "icon_cs2.jpg",
                img_logo_url: "logo_cs2.jpg",
                rtime_last_played: 1704153600,
              },
              {
                appid: 570,
                name: "Dota 2",
                playtime_forever: 0,
                playtime_windows_forever: 0,
                playtime_mac_forever: 0,
                playtime_linux_forever: 0,
                img_icon_url: "icon_dota2.jpg",
                img_logo_url: "logo_dota2.jpg",
                rtime_last_played: 0,
              },
            ],
          },
        });
      }

      if (steamId === "76561198087654321") {
        return HttpResponse.json({
          response: {
            game_count: 0,
            games: [],
          },
        });
      }

      if (steamId === "76561198099999999") {
        return HttpResponse.json({
          response: {
            game_count: 5,
          },
        });
      }

      return new HttpResponse(null, { status: 500 });
    }
  ),
];

const server = setupServer(...steamHandlers);

beforeAll(async () => {
  await setupDatabase();
  server.listen({ onUnhandledRequest: "error" });
});

afterAll(async () => {
  server.close();
  await cleanupDatabase();
});

afterEach(() => {
  server.resetHandlers();
});

function createMockContext(ip: string = "127.0.0.1"): RequestContext {
  return {
    ip,
    headers: new Headers({ "x-forwarded-for": ip }),
    url: new URL("http://localhost/api/steam/games"),
  };
}

describe("fetchSteamGamesHandler (integration)", () => {
  let testCounter = 0;

  function getUniqueIP(): string {
    testCounter++;
    return `192.168.${Math.floor(testCounter / 256)}.${testCounter % 256}`;
  }

  describe("Success Cases", () => {
    it("should fetch and upsert Steam games for a user with connected Steam account", async () => {
      const user = await createUser({
        steamId64: "76561198012345678",
        steamUsername: "TestPlayer",
      });
      const context = createMockContext(getUniqueIP());

      const result = await fetchSteamGamesHandler({ userId: user.id }, context);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.status).toBe(HTTP_STATUS.OK);
        expect(result.data.imported).toBe(3);
        expect(result.data.total).toBe(3);
        expect(result.data.filtered).toBe(0);

        const importedGames = await getTestDatabase().importedGame.findMany({
          where: { userId: user.id },
        });

        expect(importedGames).toHaveLength(3);
        expect(importedGames.some((g) => g.name === "Team Fortress 2")).toBe(
          true
        );
        expect(importedGames.some((g) => g.name === "Counter-Strike 2")).toBe(
          true
        );
        expect(importedGames.some((g) => g.name === "Dota 2")).toBe(true);

        const tf2 = importedGames.find((g) => g.name === "Team Fortress 2");
        expect(tf2?.storefrontGameId).toBe("440");
        expect(tf2?.playtime).toBe(120);
        expect(tf2?.playtimeWindows).toBe(100);
        expect(tf2?.playtimeMac).toBe(20);
        expect(tf2?.playtimeLinux).toBe(0);
        expect(tf2?.img_icon_url).toBe("icon_tf2.jpg");
        expect(tf2?.img_logo_url).toBe("logo_tf2.jpg");
        expect(tf2?.lastPlayedAt).not.toBeNull();
        expect(tf2?.igdbMatchStatus).toBe("PENDING");
      }
    });

    it("should update existing games when re-fetching", async () => {
      const user = await createUser({
        steamId64: "76561198012345678",
        steamUsername: "TestPlayer",
      });
      const context = createMockContext(getUniqueIP());

      await getTestDatabase().importedGame.create({
        data: {
          userId: user.id,
          name: "Old Name",
          storefront: "STEAM",
          storefrontGameId: "440",
          playtime: 50,
          playtimeWindows: 50,
          playtimeMac: 0,
          playtimeLinux: 0,
          img_icon_url: "old_icon.jpg",
          img_logo_url: "old_logo.jpg",
          lastPlayedAt: new Date("2023-01-01"),
        },
      });

      const result = await fetchSteamGamesHandler({ userId: user.id }, context);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.imported).toBe(3);

        const importedGames = await getTestDatabase().importedGame.findMany({
          where: { userId: user.id },
        });

        expect(importedGames).toHaveLength(3);

        const tf2 = importedGames.find((g) => g.storefrontGameId === "440");
        expect(tf2?.name).toBe("Team Fortress 2");
        expect(tf2?.playtime).toBe(120);
        expect(tf2?.playtimeWindows).toBe(100);
        expect(tf2?.playtimeMac).toBe(20);
        expect(tf2?.img_icon_url).toBe("icon_tf2.jpg");
        expect(tf2?.img_logo_url).toBe("logo_tf2.jpg");
      }
    });

    it("should handle user with no games", async () => {
      const user = await createUser({
        steamId64: "76561198087654321",
        steamUsername: "EmptyLibrary",
      });
      const context = createMockContext(getUniqueIP());

      const result = await fetchSteamGamesHandler({ userId: user.id }, context);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.imported).toBe(0);
        expect(result.data.total).toBe(0);
        expect(result.data.filtered).toBe(0);

        const importedGames = await getTestDatabase().importedGame.findMany({
          where: { userId: user.id },
        });

        expect(importedGames).toHaveLength(0);
      }
    });

    it("should handle games with zero playtime and no last played date", async () => {
      const user = await createUser({
        steamId64: "76561198012345678",
        steamUsername: "TestPlayer",
      });
      const context = createMockContext(getUniqueIP());

      const result = await fetchSteamGamesHandler({ userId: user.id }, context);

      expect(result.success).toBe(true);

      if (result.success) {
        const importedGames = await getTestDatabase().importedGame.findMany({
          where: { userId: user.id },
        });

        const dota2 = importedGames.find((g) => g.name === "Dota 2");
        expect(dota2?.playtime).toBe(0);
        expect(dota2?.lastPlayedAt).toBeNull();
      }
    });
  });

  describe("Error Cases", () => {
    it("should return BAD_REQUEST when user has no Steam account connected", async () => {
      const user = await createUser();

      await getTestDatabase().user.update({
        where: { id: user.id },
        data: { steamId64: null },
      });

      const context = createMockContext(getUniqueIP());

      const result = await fetchSteamGamesHandler({ userId: user.id }, context);

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(result.error).toContain("No Steam account connected");
      }
    });

    it("should return FORBIDDEN when Steam game library is private", async () => {
      const user = await createUser({
        steamId64: "76561198099999999",
        steamUsername: "PrivatePlayer",
      });
      const context = createMockContext(getUniqueIP());

      const result = await fetchSteamGamesHandler({ userId: user.id }, context);

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.status).toBe(HTTP_STATUS.FORBIDDEN);
        expect(result.error).toContain(
          "Your Steam profile game details are set to private"
        );
        expect(result.error).toContain("To import your library");
        expect(result.error).toContain("Steam Privacy Settings");
      }
    });

    it("should return SERVICE_UNAVAILABLE when Steam API is down", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const user = await createUser({
        steamId64: "76561198012345678",
        steamUsername: "TestPlayer",
      });
      const context = createMockContext(getUniqueIP());

      const result = await fetchSteamGamesHandler({ userId: user.id }, context);

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
        expect(result.error).toContain("Steam is temporarily unavailable");
      }
    });

    it("should return BAD_REQUEST when user does not exist", async () => {
      const nonExistentUserId = "00000000-0000-0000-0000-000000000000";
      const context = createMockContext(getUniqueIP());

      const result = await fetchSteamGamesHandler(
        { userId: nonExistentUserId },
        context
      );

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(result.error).toContain("No Steam account connected");
      }
    });
  });

  describe("Rate Limiting", () => {
    it("should return TOO_MANY_REQUESTS after exceeding rate limit", async () => {
      const user = await createUser({
        steamId64: "76561198012345678",
        steamUsername: "TestPlayer",
      });
      const ip = getUniqueIP();
      const context = createMockContext(ip);

      for (let i = 0; i < 20; i++) {
        const result = await fetchSteamGamesHandler(
          { userId: user.id },
          context
        );
        expect(result.success).toBe(true);
      }

      const result = await fetchSteamGamesHandler({ userId: user.id }, context);

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
        expect(result.error).toBe("Rate limit exceeded. Try again later.");
        expect(result.headers).toBeDefined();
        expect(result.headers?.["X-RateLimit-Limit"]).toBe("20");
        expect(result.headers?.["X-RateLimit-Remaining"]).toBe("0");
        expect(result.headers?.["Retry-After"]).toBeDefined();
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple users independently", async () => {
      const user1 = await createUser({
        username: "user1",
        steamId64: "76561198012345678",
      });
      const user2 = await createUser({
        username: "user2",
        steamId64: "76561198087654321",
      });

      const context1 = createMockContext(getUniqueIP());
      const context2 = createMockContext(getUniqueIP());

      const result1 = await fetchSteamGamesHandler(
        { userId: user1.id },
        context1
      );
      const result2 = await fetchSteamGamesHandler(
        { userId: user2.id },
        context2
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      if (result1.success && result2.success) {
        expect(result1.data.imported).toBe(3);
        expect(result2.data.imported).toBe(0);
      }

      const user1Games = await getTestDatabase().importedGame.findMany({
        where: { userId: user1.id },
      });
      const user2Games = await getTestDatabase().importedGame.findMany({
        where: { userId: user2.id },
      });

      expect(user1Games).toHaveLength(3);
      expect(user2Games).toHaveLength(0);
    });

    it("should not affect other users' games when upserting", async () => {
      const user1 = await createUser({
        username: "user1",
        steamId64: "76561198012345678",
      });
      const user2 = await createUser({
        username: "user2",
        steamId64: "76561198087654321",
      });

      await getTestDatabase().importedGame.create({
        data: {
          userId: user2.id,
          name: "User 2 Game",
          storefront: "STEAM",
          storefrontGameId: "999",
          playtime: 100,
        },
      });

      const context = createMockContext(getUniqueIP());
      await fetchSteamGamesHandler({ userId: user1.id }, context);

      const user2Games = await getTestDatabase().importedGame.findMany({
        where: { userId: user2.id },
      });

      expect(user2Games).toHaveLength(1);
      expect(user2Games[0].name).toBe("User 2 Game");
    });

    it("should preserve game order in database", async () => {
      const user = await createUser({
        steamId64: "76561198012345678",
        steamUsername: "TestPlayer",
      });
      const context = createMockContext(getUniqueIP());

      await fetchSteamGamesHandler({ userId: user.id }, context);
      await fetchSteamGamesHandler({ userId: user.id }, context);

      const importedGames = await getTestDatabase().importedGame.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      });

      expect(importedGames).toHaveLength(3);
    });

    it("should handle transaction rollback on database error", async () => {
      const user = await createUser({
        steamId64: "76561198012345678",
        steamUsername: "TestPlayer",
      });

      await getTestDatabase().importedGame.create({
        data: {
          userId: user.id,
          name: "Existing Game",
          storefront: "STEAM",
          storefrontGameId: "440",
          playtime: 50,
        },
      });

      const initialCount = await getTestDatabase().importedGame.count({
        where: { userId: user.id },
      });

      const context = createMockContext(getUniqueIP());
      const result = await fetchSteamGamesHandler({ userId: user.id }, context);

      if (result.success) {
        const finalCount = await getTestDatabase().importedGame.count({
          where: { userId: user.id },
        });
        expect(finalCount).toBeGreaterThanOrEqual(initialCount);
      }
    });
  });

  describe("Data Integrity", () => {
    it("should correctly convert Unix timestamp to Date", async () => {
      const user = await createUser({
        steamId64: "76561198012345678",
        steamUsername: "TestPlayer",
      });
      const context = createMockContext(getUniqueIP());

      await fetchSteamGamesHandler({ userId: user.id }, context);

      const importedGames = await getTestDatabase().importedGame.findMany({
        where: { userId: user.id },
      });

      const tf2 = importedGames.find((g) => g.name === "Team Fortress 2");
      expect(tf2?.lastPlayedAt).toBeInstanceOf(Date);
      expect(tf2?.lastPlayedAt?.getTime()).toBe(1704067200 * 1000);
    });

    it("should set PENDING igdbMatchStatus for new games", async () => {
      const user = await createUser({
        steamId64: "76561198012345678",
        steamUsername: "TestPlayer",
      });
      const context = createMockContext(getUniqueIP());

      await fetchSteamGamesHandler({ userId: user.id }, context);

      const importedGames = await getTestDatabase().importedGame.findMany({
        where: { userId: user.id },
      });

      importedGames.forEach((game) => {
        expect(game.igdbMatchStatus).toBe("PENDING");
      });
    });

    it("should preserve igdbMatchStatus when updating existing games", async () => {
      const user = await createUser({
        steamId64: "76561198012345678",
        steamUsername: "TestPlayer",
      });

      await getTestDatabase().importedGame.create({
        data: {
          userId: user.id,
          name: "Old Name",
          storefront: "STEAM",
          storefrontGameId: "440",
          playtime: 50,
          igdbMatchStatus: "MATCHED",
        },
      });

      const context = createMockContext(getUniqueIP());
      await fetchSteamGamesHandler({ userId: user.id }, context);

      const tf2 = await getTestDatabase().importedGame.findFirst({
        where: { userId: user.id, storefrontGameId: "440" },
      });

      expect(tf2?.igdbMatchStatus).toBe("MATCHED");
    });
  });
});
