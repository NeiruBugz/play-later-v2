import {
  cleanupDatabase,
  getTestDatabase,
  setupDatabase,
} from "@/test/setup/database";
import { createImportedGame } from "@/test/setup/db-factories/imported-game";
import { createUser } from "@/test/setup/db-factories/user";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { HTTP_STATUS } from "@/shared/config/http-codes";

import { importedGamesHandler } from "../imported-games.handler";

beforeAll(async () => {
  await setupDatabase();
});

afterAll(async () => {
  await cleanupDatabase();
});

beforeEach(async () => {
  await getTestDatabase().importedGame.deleteMany();
  await getTestDatabase().user.deleteMany();
});

describe("importedGamesHandler integration", () => {
  describe("Search Functionality", () => {
    it("should return games matching search query (case-insensitive)", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "The Legend of Zelda",
      });
      await createImportedGame({
        userId: user.id,
        name: "Zelda: Breath of the Wild",
      });
      await createImportedGame({
        userId: user.id,
        name: "Dark Souls",
      });

      const result = await importedGamesHandler({
        userId: user.id,
        search: "zelda",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(2);
        expect(
          result.data.games.every((g) => g.name.toLowerCase().includes("zelda"))
        ).toBe(true);
        expect(result.data.pagination.total).toBe(2);
      }
    });

    it("should return empty results when no matches found", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "Dark Souls",
      });
      await createImportedGame({
        userId: user.id,
        name: "Elden Ring",
      });

      const result = await importedGamesHandler({
        userId: user.id,
        search: "zelda",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(0);
        expect(result.data.pagination.total).toBe(0);
      }
    });

    it("should work with pagination when searching", async () => {
      const user = await createUser();

      for (let i = 0; i < 5; i++) {
        await createImportedGame({
          userId: user.id,
          name: `Zelda Game ${i}`,
        });
      }

      const result = await importedGamesHandler({
        userId: user.id,
        search: "zelda",
        page: 1,
        limit: 3,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(3);
        expect(result.data.pagination.total).toBe(5);
        expect(result.data.pagination.totalPages).toBe(2);
      }
    });
  });

  describe("Playtime Status Filter", () => {
    it("should return only games with playtime > 0 when filter is 'played'", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "Played Game 1",
        playtime: 100,
      });
      await createImportedGame({
        userId: user.id,
        name: "Played Game 2",
        playtime: 50,
      });
      await createImportedGame({
        userId: user.id,
        name: "Never Played",
        playtime: 0,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        playtimeStatus: "played",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(2);
        expect(result.data.games.every((g) => g.playtime! > 0)).toBe(true);
      }
    });

    it("should return only games with playtime = 0 when filter is 'never_played'", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "Played Game",
        playtime: 100,
      });
      await createImportedGame({
        userId: user.id,
        name: "Never Played 1",
        playtime: 0,
      });
      await createImportedGame({
        userId: user.id,
        name: "Never Played 2",
        playtime: 0,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        playtimeStatus: "never_played",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(2);
        expect(result.data.games.every((g) => g.playtime === 0)).toBe(true);
      }
    });
  });

  describe("Playtime Range Filter", () => {
    it("should return games with playtime < 60 for 'under_1h'", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "30 minutes",
        playtime: 30,
      });
      await createImportedGame({
        userId: user.id,
        name: "45 minutes",
        playtime: 45,
      });
      await createImportedGame({
        userId: user.id,
        name: "2 hours",
        playtime: 120,
      });
      await createImportedGame({
        userId: user.id,
        name: "Never played",
        playtime: 0,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        playtimeRange: "under_1h",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(3);
        expect(result.data.games.every((g) => g.playtime! < 60)).toBe(true);
      }
    });

    it("should return games with 60 <= playtime < 600 for '1_to_10h'", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "1 hour",
        playtime: 60,
      });
      await createImportedGame({
        userId: user.id,
        name: "5 hours",
        playtime: 300,
      });
      await createImportedGame({
        userId: user.id,
        name: "30 minutes",
        playtime: 30,
      });
      await createImportedGame({
        userId: user.id,
        name: "20 hours",
        playtime: 1200,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        playtimeRange: "1_to_10h",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(2);
        expect(
          result.data.games.every((g) => g.playtime! >= 60 && g.playtime! < 600)
        ).toBe(true);
      }
    });

    it("should return games with 600 <= playtime < 3000 for '10_to_50h'", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "10 hours",
        playtime: 600,
      });
      await createImportedGame({
        userId: user.id,
        name: "25 hours",
        playtime: 1500,
      });
      await createImportedGame({
        userId: user.id,
        name: "5 hours",
        playtime: 300,
      });
      await createImportedGame({
        userId: user.id,
        name: "100 hours",
        playtime: 6000,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        playtimeRange: "10_to_50h",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(2);
        expect(
          result.data.games.every(
            (g) => g.playtime! >= 600 && g.playtime! < 3000
          )
        ).toBe(true);
      }
    });

    it("should return games with playtime >= 3000 for 'over_50h'", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "50 hours",
        playtime: 3000,
      });
      await createImportedGame({
        userId: user.id,
        name: "100 hours",
        playtime: 6000,
      });
      await createImportedGame({
        userId: user.id,
        name: "25 hours",
        playtime: 1500,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        playtimeRange: "over_50h",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(2);
        expect(result.data.games.every((g) => g.playtime! >= 3000)).toBe(true);
      }
    });
  });

  describe("Platform Filter", () => {
    it("should return games with playtimeWindows > 0 for 'windows' filter", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "Windows Game 1",
        playtime: 100,
        playtimeWindows: 100,
        playtimeMac: 0,
        playtimeLinux: 0,
      });
      await createImportedGame({
        userId: user.id,
        name: "Windows Game 2",
        playtime: 50,
        playtimeWindows: 50,
        playtimeMac: 0,
        playtimeLinux: 0,
      });
      await createImportedGame({
        userId: user.id,
        name: "Mac Game",
        playtime: 30,
        playtimeWindows: 0,
        playtimeMac: 30,
        playtimeLinux: 0,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        platform: "windows",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(2);
        expect(result.data.games.every((g) => g.playtimeWindows! > 0)).toBe(
          true
        );
      }
    });

    it("should return games with playtimeMac > 0 for 'mac' filter", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "Mac Game 1",
        playtime: 100,
        playtimeWindows: 0,
        playtimeMac: 100,
        playtimeLinux: 0,
      });
      await createImportedGame({
        userId: user.id,
        name: "Windows Game",
        playtime: 50,
        playtimeWindows: 50,
        playtimeMac: 0,
        playtimeLinux: 0,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        platform: "mac",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(1);
        expect(result.data.games.every((g) => g.playtimeMac! > 0)).toBe(true);
      }
    });

    it("should return games with playtimeLinux > 0 for 'linux' filter", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "Linux Game 1",
        playtime: 100,
        playtimeWindows: 0,
        playtimeMac: 0,
        playtimeLinux: 100,
      });
      await createImportedGame({
        userId: user.id,
        name: "Linux Game 2",
        playtime: 50,
        playtimeWindows: 0,
        playtimeMac: 0,
        playtimeLinux: 50,
      });
      await createImportedGame({
        userId: user.id,
        name: "Windows Game",
        playtime: 30,
        playtimeWindows: 30,
        playtimeMac: 0,
        playtimeLinux: 0,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        platform: "linux",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(2);
        expect(result.data.games.every((g) => g.playtimeLinux! > 0)).toBe(true);
      }
    });
  });

  describe("Last Played Filter", () => {
    it("should return games played within last 30 days for '30_days' filter", async () => {
      const user = await createUser();
      const now = new Date();
      const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
      const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);

      await createImportedGame({
        userId: user.id,
        name: "Recent Game",
        playtime: 100,
        lastPlayedAt: twentyDaysAgo,
      });
      await createImportedGame({
        userId: user.id,
        name: "Old Game",
        playtime: 50,
        lastPlayedAt: fortyDaysAgo,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        lastPlayed: "30_days",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(1);
        expect(result.data.games[0].name).toBe("Recent Game");
      }
    });

    it("should return games played within last year for '1_year' filter", async () => {
      const user = await createUser();
      const now = new Date();
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);

      await createImportedGame({
        userId: user.id,
        name: "Recent Game",
        playtime: 100,
        lastPlayedAt: sixMonthsAgo,
      });
      await createImportedGame({
        userId: user.id,
        name: "Old Game",
        playtime: 50,
        lastPlayedAt: twoYearsAgo,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        lastPlayed: "1_year",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(1);
        expect(result.data.games[0].name).toBe("Recent Game");
      }
    });

    it("should return games played over 1 year ago for 'over_1_year' filter", async () => {
      const user = await createUser();
      const now = new Date();
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);

      await createImportedGame({
        userId: user.id,
        name: "Recent Game",
        playtime: 100,
        lastPlayedAt: sixMonthsAgo,
      });
      await createImportedGame({
        userId: user.id,
        name: "Old Game",
        playtime: 50,
        lastPlayedAt: twoYearsAgo,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        lastPlayed: "over_1_year",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(1);
        expect(result.data.games[0].name).toBe("Old Game");
      }
    });

    it("should return games with null lastPlayedAt for 'never' filter", async () => {
      const user = await createUser();
      const now = new Date();

      await createImportedGame({
        userId: user.id,
        name: "Played Game",
        playtime: 100,
        lastPlayedAt: now,
      });
      await createImportedGame({
        userId: user.id,
        name: "Never Played",
        playtime: 0,
        lastPlayedAt: null,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        lastPlayed: "never",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(1);
        expect(result.data.games[0].name).toBe("Never Played");
        expect(result.data.games[0].lastPlayedAt).toBeNull();
      }
    });
  });

  describe("Sort Options", () => {
    it("should sort alphabetically ascending for 'name_asc'", async () => {
      const user = await createUser();

      await createImportedGame({ userId: user.id, name: "Zelda" });
      await createImportedGame({ userId: user.id, name: "Dark Souls" });
      await createImportedGame({ userId: user.id, name: "Elden Ring" });

      const result = await importedGamesHandler({
        userId: user.id,
        sortBy: "name_asc",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(3);
        expect(result.data.games[0].name).toBe("Dark Souls");
        expect(result.data.games[1].name).toBe("Elden Ring");
        expect(result.data.games[2].name).toBe("Zelda");
      }
    });

    it("should sort alphabetically descending for 'name_desc'", async () => {
      const user = await createUser();

      await createImportedGame({ userId: user.id, name: "Zelda" });
      await createImportedGame({ userId: user.id, name: "Dark Souls" });
      await createImportedGame({ userId: user.id, name: "Elden Ring" });

      const result = await importedGamesHandler({
        userId: user.id,
        sortBy: "name_desc",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(3);
        expect(result.data.games[0].name).toBe("Zelda");
        expect(result.data.games[1].name).toBe("Elden Ring");
        expect(result.data.games[2].name).toBe("Dark Souls");
      }
    });

    it("should sort by playtime descending for 'playtime_desc'", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "Game 1",
        playtime: 100,
      });
      await createImportedGame({
        userId: user.id,
        name: "Game 2",
        playtime: 500,
      });
      await createImportedGame({
        userId: user.id,
        name: "Game 3",
        playtime: 50,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        sortBy: "playtime_desc",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(3);
        expect(result.data.games[0].playtime).toBe(500);
        expect(result.data.games[1].playtime).toBe(100);
        expect(result.data.games[2].playtime).toBe(50);
      }
    });

    it("should sort by playtime ascending for 'playtime_asc'", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "Game 1",
        playtime: 100,
      });
      await createImportedGame({
        userId: user.id,
        name: "Game 2",
        playtime: 500,
      });
      await createImportedGame({
        userId: user.id,
        name: "Game 3",
        playtime: 50,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        sortBy: "playtime_asc",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(3);
        expect(result.data.games[0].playtime).toBe(50);
        expect(result.data.games[1].playtime).toBe(100);
        expect(result.data.games[2].playtime).toBe(500);
      }
    });

    it("should sort by last played descending for 'last_played_desc' with nulls last", async () => {
      const user = await createUser();
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      await createImportedGame({
        userId: user.id,
        name: "Recent",
        lastPlayedAt: now,
      });
      await createImportedGame({
        userId: user.id,
        name: "Never Played",
        lastPlayedAt: null,
      });
      await createImportedGame({
        userId: user.id,
        name: "Last Week",
        lastPlayedAt: lastWeek,
      });
      await createImportedGame({
        userId: user.id,
        name: "Yesterday",
        lastPlayedAt: yesterday,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        sortBy: "last_played_desc",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(4);
        expect(result.data.games[0].name).toBe("Recent");
        expect(result.data.games[1].name).toBe("Yesterday");
        expect(result.data.games[2].name).toBe("Last Week");
        expect(result.data.games[3].name).toBe("Never Played");
        expect(result.data.games[3].lastPlayedAt).toBeNull();
      }
    });

    it("should sort by last played ascending for 'last_played_asc' with nulls last", async () => {
      const user = await createUser();
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      await createImportedGame({
        userId: user.id,
        name: "Recent",
        lastPlayedAt: now,
      });
      await createImportedGame({
        userId: user.id,
        name: "Never Played",
        lastPlayedAt: null,
      });
      await createImportedGame({
        userId: user.id,
        name: "Last Week",
        lastPlayedAt: lastWeek,
      });
      await createImportedGame({
        userId: user.id,
        name: "Yesterday",
        lastPlayedAt: yesterday,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        sortBy: "last_played_asc",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(4);
        expect(result.data.games[0].name).toBe("Last Week");
        expect(result.data.games[1].name).toBe("Yesterday");
        expect(result.data.games[2].name).toBe("Recent");
        expect(result.data.games[3].name).toBe("Never Played");
        expect(result.data.games[3].lastPlayedAt).toBeNull();
      }
    });

    it("should sort by createdAt descending for 'added_desc' (default)", async () => {
      const user = await createUser();

      const game1 = await createImportedGame({
        userId: user.id,
        name: "First",
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const game2 = await createImportedGame({
        userId: user.id,
        name: "Second",
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const game3 = await createImportedGame({
        userId: user.id,
        name: "Third",
      });

      const result = await importedGamesHandler({
        userId: user.id,
        sortBy: "added_desc",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(3);
        expect(result.data.games[0].id).toBe(game3.id);
        expect(result.data.games[1].id).toBe(game2.id);
        expect(result.data.games[2].id).toBe(game1.id);
      }
    });
  });

  describe("Filter Combinations", () => {
    it("should combine playtimeStatus=played + platform=windows + playtimeRange=over_50h", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "Match 1",
        playtime: 5000,
        playtimeWindows: 5000,
        playtimeMac: 0,
        playtimeLinux: 0,
      });
      await createImportedGame({
        userId: user.id,
        name: "Match 2",
        playtime: 3500,
        playtimeWindows: 3500,
        playtimeMac: 0,
        playtimeLinux: 0,
      });
      await createImportedGame({
        userId: user.id,
        name: "Wrong platform",
        playtime: 5000,
        playtimeWindows: 0,
        playtimeMac: 5000,
        playtimeLinux: 0,
      });
      await createImportedGame({
        userId: user.id,
        name: "Too little playtime",
        playtime: 100,
        playtimeWindows: 100,
        playtimeMac: 0,
        playtimeLinux: 0,
      });
      await createImportedGame({
        userId: user.id,
        name: "Never played",
        playtime: 0,
        playtimeWindows: 0,
        playtimeMac: 0,
        playtimeLinux: 0,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        playtimeStatus: "played",
        platform: "windows",
        playtimeRange: "over_50h",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(2);
        expect(result.data.games.every((g) => g.playtime! >= 3000)).toBe(true);
        expect(result.data.games.every((g) => g.playtimeWindows! > 0)).toBe(
          true
        );
      }
    });

    it("should combine search + playtimeStatus filter", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "Zelda Game 1",
        playtime: 100,
      });
      await createImportedGame({
        userId: user.id,
        name: "Zelda Game 2",
        playtime: 0,
      });
      await createImportedGame({
        userId: user.id,
        name: "Dark Souls",
        playtime: 200,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        search: "zelda",
        playtimeStatus: "played",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(1);
        expect(result.data.games[0].name).toBe("Zelda Game 1");
        expect(result.data.games[0].playtime).toBeGreaterThan(0);
      }
    });

    it("should combine lastPlayed + platform filters", async () => {
      const user = await createUser();
      const now = new Date();
      const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
      const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);

      await createImportedGame({
        userId: user.id,
        name: "Match",
        playtime: 100,
        playtimeWindows: 100,
        lastPlayedAt: twentyDaysAgo,
      });
      await createImportedGame({
        userId: user.id,
        name: "Wrong platform",
        playtime: 100,
        playtimeMac: 100,
        playtimeWindows: 0,
        lastPlayedAt: twentyDaysAgo,
      });
      await createImportedGame({
        userId: user.id,
        name: "Too old",
        playtime: 100,
        playtimeWindows: 100,
        lastPlayedAt: fortyDaysAgo,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        lastPlayed: "30_days",
        platform: "windows",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(1);
        expect(result.data.games[0].name).toBe("Match");
      }
    });

    it("should combine search + filters + sort", async () => {
      const user = await createUser();

      await createImportedGame({
        userId: user.id,
        name: "Zelda Game 1",
        playtime: 500,
        playtimeWindows: 500,
      });
      await createImportedGame({
        userId: user.id,
        name: "Zelda Game 2",
        playtime: 1000,
        playtimeWindows: 1000,
      });
      await createImportedGame({
        userId: user.id,
        name: "Zelda Game 3",
        playtime: 200,
        playtimeWindows: 200,
      });
      await createImportedGame({
        userId: user.id,
        name: "Dark Souls",
        playtime: 800,
        playtimeWindows: 800,
      });

      const result = await importedGamesHandler({
        userId: user.id,
        search: "zelda",
        platform: "windows",
        sortBy: "playtime_desc",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(3);
        expect(result.data.games[0].playtime).toBe(1000);
        expect(result.data.games[1].playtime).toBe(500);
        expect(result.data.games[2].playtime).toBe(200);
      }
    });
  });

  describe("Pagination", () => {
    it("should handle default pagination (page 1, limit 25)", async () => {
      const user = await createUser();

      for (let i = 0; i < 30; i++) {
        await createImportedGame({
          userId: user.id,
          name: `Game ${i}`,
        });
      }

      const result = await importedGamesHandler({
        userId: user.id,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(25);
        expect(result.data.pagination.page).toBe(1);
        expect(result.data.pagination.limit).toBe(25);
        expect(result.data.pagination.total).toBe(30);
        expect(result.data.pagination.totalPages).toBe(2);
      }
    });

    it("should handle custom pagination", async () => {
      const user = await createUser();

      for (let i = 0; i < 30; i++) {
        await createImportedGame({
          userId: user.id,
          name: `Game ${i}`,
        });
      }

      const result = await importedGamesHandler({
        userId: user.id,
        page: 2,
        limit: 10,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(10);
        expect(result.data.pagination.page).toBe(2);
        expect(result.data.pagination.limit).toBe(10);
        expect(result.data.pagination.total).toBe(30);
        expect(result.data.pagination.totalPages).toBe(3);
      }
    });

    it("should enforce max limit of 100", async () => {
      const user = await createUser();

      for (let i = 0; i < 150; i++) {
        await createImportedGame({
          userId: user.id,
          name: `Game ${i}`,
        });
      }

      const result = await importedGamesHandler({
        userId: user.id,
        limit: 200,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(100);
        expect(result.data.pagination.limit).toBe(100);
      }
    });

    it("should handle invalid page numbers gracefully", async () => {
      const user = await createUser();

      await createImportedGame({ userId: user.id, name: "Game 1" });

      const result = await importedGamesHandler({
        userId: user.id,
        page: 0,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.pagination.page).toBe(1);
      }
    });
  });

  describe("User Isolation", () => {
    it("should only return games for the specified user", async () => {
      const user1 = await createUser({ username: "user1" });
      const user2 = await createUser({ username: "user2" });

      await createImportedGame({ userId: user1.id, name: "User 1 Game" });
      await createImportedGame({ userId: user2.id, name: "User 2 Game" });

      const result = await importedGamesHandler({
        userId: user1.id,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(1);
        expect(result.data.games[0].name).toBe("User 1 Game");
      }
    });
  });

  describe("Error Cases", () => {
    it("should return success with empty results for non-existent user", async () => {
      const result = await importedGamesHandler({
        userId: "00000000-0000-0000-0000-000000000000",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(0);
        expect(result.data.pagination.total).toBe(0);
      }
    });

    it("should handle empty database gracefully", async () => {
      const user = await createUser();

      const result = await importedGamesHandler({
        userId: user.id,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.games).toHaveLength(0);
        expect(result.data.pagination.total).toBe(0);
        expect(result.data.pagination.totalPages).toBe(0);
        expect(result.status).toBe(HTTP_STATUS.OK);
      }
    });
  });
});
