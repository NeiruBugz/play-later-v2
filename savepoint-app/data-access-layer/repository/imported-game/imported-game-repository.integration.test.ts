import { NotFoundError } from "@/data-access-layer/repository";
import {
  cleanupDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";
import { createUser } from "@/test/setup/db-factories";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  countImportedGamesByUserId,
  findImportedGamesByUserId,
  softDeleteImportedGame,
  updateImportedGameStatus,
  upsertManyImportedGames,
} from "./imported-game-repository";
import type { CreateImportedGameInput } from "./types";

describe("ImportedGameRepository Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe("upsertManyImportedGames", () => {
    it("should create new imported games when they don't exist", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Game 1",
          storefront: "STEAM",
          storefrontGameId: "440",
          playtime: 120,
          playtimeWindows: 100,
          playtimeMac: 20,
          playtimeLinux: 0,
          img_icon_url: "icon1.jpg",
          img_logo_url: "logo1.jpg",
          lastPlayedAt: new Date("2024-01-01"),
        },
        {
          name: "Game 2",
          storefront: "STEAM",
          storefrontGameId: "730",
          playtime: 50,
          playtimeWindows: 50,
          playtimeMac: 0,
          playtimeLinux: 0,
          img_icon_url: "icon2.jpg",
          img_logo_url: "logo2.jpg",
          lastPlayedAt: new Date("2024-01-02"),
        },
      ];

      const count = await upsertManyImportedGames(user.id, games);
      expect(count).toBe(2);

      const findResult = await findImportedGamesByUserId(user.id, {
        limit: 10,
        sortBy: "name_asc",
      });
      expect(findResult.items).toHaveLength(2);
      expect(findResult.items[0].name).toBe("Game 1");
      expect(findResult.items[0].storefrontGameId).toBe("440");
      expect(findResult.items[0].playtime).toBe(120);
      expect(findResult.items[1].name).toBe("Game 2");
    });

    it("should update existing imported games when they already exist", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const initialGames: CreateImportedGameInput[] = [
        {
          name: "Initial Name",
          storefront: "STEAM",
          storefrontGameId: "440",
          playtime: 100,
          playtimeWindows: 100,
          playtimeMac: 0,
          playtimeLinux: 0,
          img_icon_url: "old_icon.jpg",
          img_logo_url: "old_logo.jpg",
          lastPlayedAt: new Date("2024-01-01"),
        },
      ];

      await upsertManyImportedGames(user.id, initialGames);

      const updatedGames: CreateImportedGameInput[] = [
        {
          name: "Updated Name",
          storefront: "STEAM",
          storefrontGameId: "440",
          playtime: 200,
          playtimeWindows: 150,
          playtimeMac: 30,
          playtimeLinux: 20,
          img_icon_url: "new_icon.jpg",
          img_logo_url: "new_logo.jpg",
          lastPlayedAt: new Date("2024-01-15"),
        },
      ];

      const count = await upsertManyImportedGames(user.id, updatedGames);
      expect(count).toBe(1);

      const findResult = await findImportedGamesByUserId(user.id, {
        limit: 10,
      });
      expect(findResult.items).toHaveLength(1);
      const game = findResult.items[0];
      expect(game.name).toBe("Updated Name");
      expect(game.playtime).toBe(200);
      expect(game.playtimeWindows).toBe(150);
      expect(game.playtimeMac).toBe(30);
      expect(game.playtimeLinux).toBe(20);
      expect(game.img_icon_url).toBe("new_icon.jpg");
      expect(game.img_logo_url).toBe("new_logo.jpg");
      expect(game.lastPlayedAt?.toISOString()).toBe(
        new Date("2024-01-15").toISOString()
      );
    });

    it("should handle games with null/undefined optional fields", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Minimal Game",
          storefront: "STEAM",
          storefrontGameId: "999",
          playtime: null,
          playtimeWindows: null,
          playtimeMac: null,
          playtimeLinux: null,
          img_icon_url: null,
          img_logo_url: null,
          lastPlayedAt: null,
        },
      ];

      const count = await upsertManyImportedGames(user.id, games);
      expect(count).toBe(1);

      const findResult = await findImportedGamesByUserId(user.id, {
        limit: 10,
      });
      const game = findResult.items[0];
      expect(game.name).toBe("Minimal Game");
      expect(game.playtime).toBe(0);
      expect(game.playtimeWindows).toBe(0);
      expect(game.playtimeMac).toBe(0);
      expect(game.playtimeLinux).toBe(0);
      expect(game.img_icon_url).toBeNull();
      expect(game.img_logo_url).toBeNull();
      expect(game.lastPlayedAt).toBeNull();
    });

    it("should not update soft-deleted games", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Deleted Game",
          storefront: "STEAM",
          storefrontGameId: "123",
          playtime: 100,
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const findResult = await findImportedGamesByUserId(user.id, {
        limit: 10,
      });
      const gameId = findResult.items[0].id;
      await softDeleteImportedGame(gameId, user.id);

      const updatedGames: CreateImportedGameInput[] = [
        {
          name: "Updated Deleted Game",
          storefront: "STEAM",
          storefrontGameId: "123",
          playtime: 200,
        },
      ];

      await upsertManyImportedGames(user.id, updatedGames);

      const finalFindResult = await findImportedGamesByUserId(user.id, {
        limit: 10,
      });
      expect(finalFindResult.items).toHaveLength(1);
      expect(finalFindResult.items[0].name).toBe("Updated Deleted Game");
    });

    it("should isolate games by userId", async () => {
      const user1 = await createUser({ steamId64: "76561198012345678" });
      const user2 = await createUser({ steamId64: "76561198087654321" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Shared Game",
          storefront: "STEAM",
          storefrontGameId: "440",
          playtime: 100,
        },
      ];

      await upsertManyImportedGames(user1.id, games);
      await upsertManyImportedGames(user2.id, games);

      const user1Games = await findImportedGamesByUserId(user1.id, {
        limit: 10,
      });
      const user2Games = await findImportedGamesByUserId(user2.id, {
        limit: 10,
      });

      expect(user1Games.items).toHaveLength(1);
      expect(user2Games.items).toHaveLength(1);
      expect(user1Games.items[0].id).not.toBe(user2Games.items[0].id);
    });
  });

  describe("findImportedGamesByUserId", () => {
    it("should return paginated games for a user", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = Array.from(
        { length: 30 },
        (_, i) => ({
          name: `Game ${i + 1}`,
          storefront: "STEAM",
          storefrontGameId: `${i + 1}`,
          playtime: i * 10,
        })
      );

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(30);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
    });

    it("should return second page of results", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = Array.from(
        { length: 30 },
        (_, i) => ({
          name: `Game ${i + 1}`,
          storefront: "STEAM",
          storefrontGameId: `${i + 1}`,
          playtime: i * 10,
        })
      );

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        page: 2,
        limit: 10,
      });

      expect(result.items).toHaveLength(10);
      expect(result.page).toBe(2);
    });

    it("should return empty array for user with no games", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const result = await findImportedGamesByUserId(user.id, { limit: 10 });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("should filter by search query", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Counter-Strike: Global Offensive",
          storefront: "STEAM",
          storefrontGameId: "730",
          playtime: 100,
        },
        {
          name: "Team Fortress 2",
          storefront: "STEAM",
          storefrontGameId: "440",
          playtime: 50,
        },
        {
          name: "Counter-Strike 2",
          storefront: "STEAM",
          storefrontGameId: "732",
          playtime: 200,
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        search: "counter-strike",
        limit: 10,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.some((g) => g.name.includes("Counter-Strike"))).toBe(
        true
      );
    });

    it("should filter by playtime status - played", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Played Game",
          storefront: "STEAM",
          storefrontGameId: "1",
          playtime: 100,
        },
        {
          name: "Never Played Game",
          storefront: "STEAM",
          storefrontGameId: "2",
          playtime: 0,
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        playtimeStatus: "played",
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Played Game");
    });

    it("should filter by playtime status - never played", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Played Game",
          storefront: "STEAM",
          storefrontGameId: "1",
          playtime: 100,
        },
        {
          name: "Never Played Game",
          storefront: "STEAM",
          storefrontGameId: "2",
          playtime: 0,
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        playtimeStatus: "never_played",
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Never Played Game");
    });

    it("should filter by playtime range - under 1h", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Short Game",
          storefront: "STEAM",
          storefrontGameId: "1",
          playtime: 30,
        },
        {
          name: "Long Game",
          storefront: "STEAM",
          storefrontGameId: "2",
          playtime: 120,
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        playtimeRange: "under_1h",
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Short Game");
    });

    it("should filter by platform - Windows", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Windows Game",
          storefront: "STEAM",
          storefrontGameId: "1",
          playtime: 100,
          playtimeWindows: 100,
          playtimeMac: 0,
          playtimeLinux: 0,
        },
        {
          name: "Mac Game",
          storefront: "STEAM",
          storefrontGameId: "2",
          playtime: 50,
          playtimeWindows: 0,
          playtimeMac: 50,
          playtimeLinux: 0,
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        platform: "windows",
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Windows Game");
    });

    it("should sort by name ascending", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Zebra Game",
          storefront: "STEAM",
          storefrontGameId: "1",
          playtime: 10,
        },
        {
          name: "Alpha Game",
          storefront: "STEAM",
          storefrontGameId: "2",
          playtime: 20,
        },
        {
          name: "Beta Game",
          storefront: "STEAM",
          storefrontGameId: "3",
          playtime: 30,
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        sortBy: "name_asc",
        limit: 10,
      });

      expect(result.items[0].name).toBe("Alpha Game");
      expect(result.items[1].name).toBe("Beta Game");
      expect(result.items[2].name).toBe("Zebra Game");
    });

    it("should sort by playtime descending", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Game 1",
          storefront: "STEAM",
          storefrontGameId: "1",
          playtime: 50,
        },
        {
          name: "Game 2",
          storefront: "STEAM",
          storefrontGameId: "2",
          playtime: 200,
        },
        {
          name: "Game 3",
          storefront: "STEAM",
          storefrontGameId: "3",
          playtime: 100,
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        sortBy: "playtime_desc",
        limit: 10,
      });

      expect(result.items[0].playtime).toBe(200);
      expect(result.items[1].playtime).toBe(100);
      expect(result.items[2].playtime).toBe(50);
    });

    it("should enforce limit validation (max 100)", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = Array.from(
        { length: 150 },
        (_, i) => ({
          name: `Game ${i + 1}`,
          storefront: "STEAM",
          storefrontGameId: `${i + 1}`,
          playtime: i * 10,
        })
      );

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        page: 1,
        limit: 200,
      });

      expect(result.items.length).toBeLessThanOrEqual(100);
      expect(result.limit).toBe(100);
    });

    it("should filter by matchStatus - single status (PENDING)", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Pending Game",
          storefront: "STEAM",
          storefrontGameId: "1",
          playtime: 100,
          igdbMatchStatus: "PENDING",
        },
        {
          name: "Matched Game",
          storefront: "STEAM",
          storefrontGameId: "2",
          playtime: 50,
          igdbMatchStatus: "MATCHED",
        },
        {
          name: "Unmatched Game",
          storefront: "STEAM",
          storefrontGameId: "3",
          playtime: 75,
          igdbMatchStatus: "UNMATCHED",
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        matchStatus: ["PENDING"],
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Pending Game");
      expect(result.items[0].igdbMatchStatus).toBe("PENDING");
    });

    it("should filter by matchStatus - multiple statuses (PENDING and UNMATCHED)", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Pending Game",
          storefront: "STEAM",
          storefrontGameId: "1",
          playtime: 100,
          igdbMatchStatus: "PENDING",
        },
        {
          name: "Matched Game",
          storefront: "STEAM",
          storefrontGameId: "2",
          playtime: 50,
          igdbMatchStatus: "MATCHED",
        },
        {
          name: "Unmatched Game",
          storefront: "STEAM",
          storefrontGameId: "3",
          playtime: 75,
          igdbMatchStatus: "UNMATCHED",
        },
        {
          name: "Ignored Game",
          storefront: "STEAM",
          storefrontGameId: "4",
          playtime: 25,
          igdbMatchStatus: "IGNORED",
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        matchStatus: ["PENDING", "UNMATCHED"],
        limit: 10,
      });

      expect(result.items).toHaveLength(2);
      const statuses = result.items.map((g) => g.igdbMatchStatus);
      expect(statuses).toContain("PENDING");
      expect(statuses).toContain("UNMATCHED");
      expect(statuses).not.toContain("MATCHED");
      expect(statuses).not.toContain("IGNORED");
    });

    it("should filter by matchStatus - all statuses", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Pending Game",
          storefront: "STEAM",
          storefrontGameId: "1",
          playtime: 100,
          igdbMatchStatus: "PENDING",
        },
        {
          name: "Matched Game",
          storefront: "STEAM",
          storefrontGameId: "2",
          playtime: 50,
          igdbMatchStatus: "MATCHED",
        },
        {
          name: "Unmatched Game",
          storefront: "STEAM",
          storefrontGameId: "3",
          playtime: 75,
          igdbMatchStatus: "UNMATCHED",
        },
        {
          name: "Ignored Game",
          storefront: "STEAM",
          storefrontGameId: "4",
          playtime: 25,
          igdbMatchStatus: "IGNORED",
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        matchStatus: ["PENDING", "MATCHED", "UNMATCHED", "IGNORED"],
        limit: 10,
      });

      expect(result.items).toHaveLength(4);
    });

    it("should return empty result when filtering for status with no matching games", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Pending Game",
          storefront: "STEAM",
          storefrontGameId: "1",
          playtime: 100,
          igdbMatchStatus: "PENDING",
        },
        {
          name: "Unmatched Game",
          storefront: "STEAM",
          storefrontGameId: "2",
          playtime: 50,
          igdbMatchStatus: "UNMATCHED",
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        matchStatus: ["MATCHED"],
        limit: 10,
      });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("should show all games when no matchStatus filter provided", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Pending Game",
          storefront: "STEAM",
          storefrontGameId: "1",
          playtime: 100,
          igdbMatchStatus: "PENDING",
        },
        {
          name: "Matched Game",
          storefront: "STEAM",
          storefrontGameId: "2",
          playtime: 50,
          igdbMatchStatus: "MATCHED",
        },
        {
          name: "Unmatched Game",
          storefront: "STEAM",
          storefrontGameId: "3",
          playtime: 75,
          igdbMatchStatus: "UNMATCHED",
        },
        {
          name: "Ignored Game",
          storefront: "STEAM",
          storefrontGameId: "4",
          playtime: 25,
          igdbMatchStatus: "IGNORED",
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        limit: 10,
      });

      expect(result.items).toHaveLength(4);
    });

    it("should show all games when matchStatus is empty array", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Pending Game",
          storefront: "STEAM",
          storefrontGameId: "1",
          playtime: 100,
          igdbMatchStatus: "PENDING",
        },
        {
          name: "Matched Game",
          storefront: "STEAM",
          storefrontGameId: "2",
          playtime: 50,
          igdbMatchStatus: "MATCHED",
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        matchStatus: [],
        limit: 10,
      });

      expect(result.items).toHaveLength(2);
    });

    it("should combine matchStatus filter with other filters", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Counter-Strike Pending",
          storefront: "STEAM",
          storefrontGameId: "1",
          playtime: 100,
          igdbMatchStatus: "PENDING",
        },
        {
          name: "Counter-Strike Matched",
          storefront: "STEAM",
          storefrontGameId: "2",
          playtime: 50,
          igdbMatchStatus: "MATCHED",
        },
        {
          name: "Team Fortress Pending",
          storefront: "STEAM",
          storefrontGameId: "3",
          playtime: 75,
          igdbMatchStatus: "PENDING",
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const result = await findImportedGamesByUserId(user.id, {
        search: "counter-strike",
        matchStatus: ["PENDING"],
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Counter-Strike Pending");
      expect(result.items[0].igdbMatchStatus).toBe("PENDING");
    });
  });

  describe("countImportedGamesByUserId", () => {
    it("should return correct count of imported games", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = Array.from(
        { length: 15 },
        (_, i) => ({
          name: `Game ${i + 1}`,
          storefront: "STEAM",
          storefrontGameId: `${i + 1}`,
          playtime: i * 10,
        })
      );

      await upsertManyImportedGames(user.id, games);

      const count = await countImportedGamesByUserId(user.id);
      expect(count).toBe(15);
    });

    it("should return 0 for user with no games", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const count = await countImportedGamesByUserId(user.id);
      expect(count).toBe(0);
    });

    it("should not count soft-deleted games", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Game 1",
          storefront: "STEAM",
          storefrontGameId: "1",
          playtime: 10,
        },
        {
          name: "Game 2",
          storefront: "STEAM",
          storefrontGameId: "2",
          playtime: 20,
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const findResult = await findImportedGamesByUserId(user.id, {
        limit: 10,
      });
      await softDeleteImportedGame(findResult.items[0].id, user.id);

      const count = await countImportedGamesByUserId(user.id);
      expect(count).toBe(1);
    });
  });

  describe("updateImportedGameStatus", () => {
    it("should successfully update the IGDB match status", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Test Game",
          storefront: "STEAM",
          storefrontGameId: "123",
          playtime: 100,
          igdbMatchStatus: "PENDING",
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const findResult = await findImportedGamesByUserId(user.id, {
        limit: 10,
      });
      const gameId = findResult.items[0].id;
      expect(findResult.items[0].igdbMatchStatus).toBe("PENDING");

      const updateResult = await updateImportedGameStatus(
        gameId,
        user.id,
        "MATCHED"
      );

      expect(updateResult.igdbMatchStatus).toBe("MATCHED");
      expect(updateResult.id).toBe(gameId);

      const verifyResult = await findImportedGamesByUserId(user.id, {
        limit: 10,
      });
      expect(verifyResult.items[0].igdbMatchStatus).toBe("MATCHED");
    });

    it("should update status through all valid states", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Test Game",
          storefront: "STEAM",
          storefrontGameId: "123",
          playtime: 100,
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const findResult = await findImportedGamesByUserId(user.id, {
        limit: 10,
      });
      const gameId = findResult.items[0].id;

      const pendingResult = await updateImportedGameStatus(
        gameId,
        user.id,
        "PENDING"
      );
      expect(pendingResult.igdbMatchStatus).toBe("PENDING");

      const matchedResult = await updateImportedGameStatus(
        gameId,
        user.id,
        "MATCHED"
      );
      expect(matchedResult.igdbMatchStatus).toBe("MATCHED");

      const unmatchedResult = await updateImportedGameStatus(
        gameId,
        user.id,
        "UNMATCHED"
      );
      expect(unmatchedResult.igdbMatchStatus).toBe("UNMATCHED");

      const ignoredResult = await updateImportedGameStatus(
        gameId,
        user.id,
        "IGNORED"
      );
      expect(ignoredResult.igdbMatchStatus).toBe("IGNORED");
    });

    it("should prevent updating another user's imported game", async () => {
      const user1 = await createUser({ steamId64: "76561198012345678" });
      const user2 = await createUser({ steamId64: "76561198087654321" });

      const games: CreateImportedGameInput[] = [
        {
          name: "User 1 Game",
          storefront: "STEAM",
          storefrontGameId: "123",
          playtime: 100,
        },
      ];

      await upsertManyImportedGames(user1.id, games);

      const findResult = await findImportedGamesByUserId(user1.id, {
        limit: 10,
      });
      const gameId = findResult.items[0].id;

      await expect(
        updateImportedGameStatus(gameId, user2.id, "MATCHED")
      ).rejects.toThrow(NotFoundError);

      const verifyResult = await findImportedGamesByUserId(user1.id, {
        limit: 10,
      });
      expect(verifyResult.items[0].igdbMatchStatus).toBe("PENDING");
    });

    it("should not update soft-deleted games", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Deleted Game",
          storefront: "STEAM",
          storefrontGameId: "123",
          playtime: 100,
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const findResult = await findImportedGamesByUserId(user.id, {
        limit: 10,
      });
      const gameId = findResult.items[0].id;

      await softDeleteImportedGame(gameId, user.id);

      await expect(
        updateImportedGameStatus(gameId, user.id, "MATCHED")
      ).rejects.toThrow(NotFoundError);
    });

    it("should return NOT_FOUND error for non-existent game ID", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      await expect(
        updateImportedGameStatus("non-existent-id", user.id, "MATCHED")
      ).rejects.toThrow(NotFoundError);
    });

    it("should update the updatedAt timestamp", async () => {
      const user = await createUser({ steamId64: "76561198012345678" });

      const games: CreateImportedGameInput[] = [
        {
          name: "Test Game",
          storefront: "STEAM",
          storefrontGameId: "123",
          playtime: 100,
        },
      ];

      await upsertManyImportedGames(user.id, games);

      const findResult = await findImportedGamesByUserId(user.id, {
        limit: 10,
      });
      const gameId = findResult.items[0].id;
      const originalUpdatedAt = findResult.items[0].updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updateResult = await updateImportedGameStatus(
        gameId,
        user.id,
        "MATCHED"
      );

      expect(updateResult.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });
});
