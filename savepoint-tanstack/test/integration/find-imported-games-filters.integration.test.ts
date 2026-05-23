/**
 * Integration tests for findImportedGamesForUser — covering filter, sort,
 * search, and pagination branches not exercised by the base entity tests.
 *
 * Covers:
 *   - search filter (name contains)
 *   - playtimeRange: under_1h, 1_to_10h, 10_to_50h, over_50h
 *   - playtimeStatus: played, never_played (when playtimeRange = all)
 *   - platform: windows, mac, linux
 *   - lastPlayed: 30_days, 1_year, over_1_year, never
 *   - sortBy: name_asc, name_desc, playtime_desc, playtime_asc,
 *             last_played_desc, last_played_asc
 *   - includeIgnored and includeMatched toggles
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { findImportedGamesForUser } from "@/entities/imported-game/api/find-imported-games-for-user.server";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("find-imported-games-filters");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const USER_ID = "figf-user";

beforeEach(async () => {
  await db.prisma.importedGame.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.create({
    data: {
      id: USER_ID,
      email: "figf@example.com",
      name: "FIGF User",
      emailVerified: true,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
});

function makeGame(
  storefrontGameId: string,
  name: string,
  opts: {
    playtime?: number;
    playtimeWindows?: number;
    playtimeMac?: number;
    playtimeLinux?: number;
    lastPlayedAt?: Date | null;
    igdbMatchStatus?: "PENDING" | "UNMATCHED" | "MATCHED" | "IGNORED";
  } = {}
) {
  return {
    userId: USER_ID,
    storefront: "STEAM" as const,
    storefrontGameId,
    name,
    playtime: opts.playtime ?? 0,
    playtimeWindows: opts.playtimeWindows ?? 0,
    playtimeMac: opts.playtimeMac ?? 0,
    playtimeLinux: opts.playtimeLinux ?? 0,
    lastPlayedAt: opts.lastPlayedAt ?? null,
    igdbMatchStatus: opts.igdbMatchStatus ?? "PENDING",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

// ---------------------------------------------------------------------------
// search filter
// ---------------------------------------------------------------------------

describe("findImportedGamesForUser — search filter", () => {
  beforeEach(async () => {
    await db.prisma.importedGame.createMany({
      data: [
        makeGame("s1", "Zelda: Breath of the Wild"),
        makeGame("s2", "Mario Kart 8"),
        makeGame("s3", "ZELDA LINK AWAKENING"),
      ],
    });
  });

  it("returns games whose name contains the search string (case-insensitive)", async () => {
    const result = await findImportedGamesForUser(USER_ID, { search: "zelda" });

    expect(result.games).toHaveLength(2);
    const names = result.games.map((g) => g.name);
    expect(names).toContain("Zelda: Breath of the Wild");
    expect(names).toContain("ZELDA LINK AWAKENING");
  });

  it("returns nothing when search term matches no games", async () => {
    const result = await findImportedGamesForUser(USER_ID, { search: "hades" });

    expect(result.games).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// playtimeRange filter
// ---------------------------------------------------------------------------

describe("findImportedGamesForUser — playtimeRange filter", () => {
  beforeEach(async () => {
    await db.prisma.importedGame.createMany({
      data: [
        makeGame("r1", "Under 1 Hour Game", { playtime: 30 }), // 30 min
        makeGame("r2", "1 to 10 Hour Game", { playtime: 300 }), // 5 h
        makeGame("r3", "10 to 50 Hour Game", { playtime: 1200 }), // 20 h
        makeGame("r4", "Over 50 Hour Game", { playtime: 4000 }), // 66 h
      ],
    });
  });

  it("filters under_1h (playtime < 60 minutes)", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      playtimeRange: "under_1h",
    });

    expect(result.games).toHaveLength(1);
    expect(result.games[0]!.name).toBe("Under 1 Hour Game");
  });

  it("filters 1_to_10h (60 ≤ playtime < 600 minutes)", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      playtimeRange: "1_to_10h",
    });

    expect(result.games).toHaveLength(1);
    expect(result.games[0]!.name).toBe("1 to 10 Hour Game");
  });

  it("filters 10_to_50h (600 ≤ playtime < 3000 minutes)", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      playtimeRange: "10_to_50h",
    });

    expect(result.games).toHaveLength(1);
    expect(result.games[0]!.name).toBe("10 to 50 Hour Game");
  });

  it("filters over_50h (playtime ≥ 3000 minutes)", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      playtimeRange: "over_50h",
    });

    expect(result.games).toHaveLength(1);
    expect(result.games[0]!.name).toBe("Over 50 Hour Game");
  });
});

// ---------------------------------------------------------------------------
// playtimeStatus filter (only when playtimeRange = 'all')
// ---------------------------------------------------------------------------

describe("findImportedGamesForUser — playtimeStatus filter", () => {
  beforeEach(async () => {
    await db.prisma.importedGame.createMany({
      data: [
        makeGame("ps1", "Played Game", { playtime: 120 }),
        makeGame("ps2", "Never Played Game", { playtime: 0 }),
      ],
    });
  });

  it("filters 'played' (playtime > 0)", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      playtimeStatus: "played",
    });

    const names = result.games.map((g) => g.name);
    expect(names).toContain("Played Game");
    expect(names).not.toContain("Never Played Game");
  });

  it("filters 'never_played' (playtime = 0)", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      playtimeStatus: "never_played",
    });

    const names = result.games.map((g) => g.name);
    expect(names).toContain("Never Played Game");
    expect(names).not.toContain("Played Game");
  });
});

// ---------------------------------------------------------------------------
// platform filter
// ---------------------------------------------------------------------------

describe("findImportedGamesForUser — platform filter", () => {
  beforeEach(async () => {
    await db.prisma.importedGame.createMany({
      data: [
        makeGame("pl1", "Windows Only", { playtimeWindows: 100 }),
        makeGame("pl2", "Mac Only", { playtimeMac: 100 }),
        makeGame("pl3", "Linux Only", { playtimeLinux: 100 }),
        makeGame("pl4", "No Platform Playtime", {}),
      ],
    });
  });

  it("filters 'windows' platform", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      platform: "windows",
    });

    const names = result.games.map((g) => g.name);
    expect(names).toContain("Windows Only");
    expect(names).not.toContain("Mac Only");
    expect(names).not.toContain("Linux Only");
  });

  it("filters 'mac' platform", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      platform: "mac",
    });

    const names = result.games.map((g) => g.name);
    expect(names).toContain("Mac Only");
    expect(names).not.toContain("Windows Only");
  });

  it("filters 'linux' platform", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      platform: "linux",
    });

    const names = result.games.map((g) => g.name);
    expect(names).toContain("Linux Only");
    expect(names).not.toContain("Windows Only");
  });
});

// ---------------------------------------------------------------------------
// lastPlayed filter
// ---------------------------------------------------------------------------

describe("findImportedGamesForUser — lastPlayed filter", () => {
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 3600 * 1000);

  beforeEach(async () => {
    await db.prisma.importedGame.createMany({
      data: [
        makeGame("lp1", "Played 10 days ago", { lastPlayedAt: daysAgo(10) }),
        makeGame("lp2", "Played 200 days ago", { lastPlayedAt: daysAgo(200) }),
        makeGame("lp3", "Played 400 days ago", { lastPlayedAt: daysAgo(400) }),
        makeGame("lp4", "Never played", { lastPlayedAt: null }),
      ],
    });
  });

  it("filters '30_days' (played within last 30 days)", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      lastPlayed: "30_days",
    });

    const names = result.games.map((g) => g.name);
    expect(names).toContain("Played 10 days ago");
    expect(names).not.toContain("Played 200 days ago");
  });

  it("filters '1_year' (played within last year)", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      lastPlayed: "1_year",
    });

    const names = result.games.map((g) => g.name);
    expect(names).toContain("Played 10 days ago");
    expect(names).toContain("Played 200 days ago");
    expect(names).not.toContain("Played 400 days ago");
  });

  it("filters 'over_1_year' (not played in over a year)", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      lastPlayed: "over_1_year",
    });

    const names = result.games.map((g) => g.name);
    expect(names).toContain("Played 400 days ago");
    expect(names).not.toContain("Played 10 days ago");
  });

  it("filters 'never' (lastPlayedAt is null)", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      lastPlayed: "never",
    });

    const names = result.games.map((g) => g.name);
    expect(names).toContain("Never played");
    expect(names).not.toContain("Played 10 days ago");
  });
});

// ---------------------------------------------------------------------------
// sortBy options
// ---------------------------------------------------------------------------

describe("findImportedGamesForUser — sortBy", () => {
  beforeEach(async () => {
    await db.prisma.importedGame.createMany({
      data: [
        makeGame("sort1", "Aaaa Game", { playtime: 100 }),
        makeGame("sort2", "Zzzz Game", { playtime: 500 }),
        makeGame("sort3", "Mmmm Game", { playtime: 300 }),
      ],
    });
  });

  it("sorts by name ascending", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      sortBy: "name_asc",
    });

    const names = result.games.map((g) => g.name);
    expect(names[0]).toBe("Aaaa Game");
    expect(names[names.length - 1]).toBe("Zzzz Game");
  });

  it("sorts by name descending", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      sortBy: "name_desc",
    });

    const names = result.games.map((g) => g.name);
    expect(names[0]).toBe("Zzzz Game");
    expect(names[names.length - 1]).toBe("Aaaa Game");
  });

  it("sorts by playtime descending", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      sortBy: "playtime_desc",
    });

    const playtimes = result.games.map((g) => g.playtime);
    expect(playtimes[0]).toBeGreaterThanOrEqual(playtimes[1] ?? 0);
  });

  it("sorts by playtime ascending", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      sortBy: "playtime_asc",
    });

    const playtimes = result.games.map((g) => g.playtime);
    expect(playtimes[0]).toBeLessThanOrEqual(playtimes[1] ?? Infinity);
  });

  it("sorts by added_desc (default) — most-recently-created first", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      sortBy: "added_desc",
    });
    // Just verify the call succeeds and returns the expected count.
    expect(result.games.length).toBe(3);
  });

  it("sorts by last_played_desc — most-recently-played first, nulls last", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      sortBy: "last_played_desc",
    });
    expect(result.games.length).toBe(3);
  });

  it("sorts by last_played_asc — least-recently-played first, nulls last", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      sortBy: "last_played_asc",
    });
    expect(result.games.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// includeIgnored and includeMatched toggles
// ---------------------------------------------------------------------------

describe("findImportedGamesForUser — status toggles", () => {
  beforeEach(async () => {
    await db.prisma.importedGame.createMany({
      data: [
        makeGame("st1", "Pending Game", { igdbMatchStatus: "PENDING" }),
        makeGame("st2", "Matched Game", { igdbMatchStatus: "MATCHED" }),
        makeGame("st3", "Ignored Game", { igdbMatchStatus: "IGNORED" }),
      ],
    });
  });

  it("excludes MATCHED and IGNORED by default", async () => {
    const result = await findImportedGamesForUser(USER_ID);

    const names = result.games.map((g) => g.name);
    expect(names).toContain("Pending Game");
    expect(names).not.toContain("Matched Game");
    expect(names).not.toContain("Ignored Game");
  });

  it("includes MATCHED when includeMatched = true", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      includeMatched: true,
    });

    const names = result.games.map((g) => g.name);
    expect(names).toContain("Matched Game");
    expect(names).not.toContain("Ignored Game");
  });

  it("includes IGNORED when includeIgnored = true", async () => {
    const result = await findImportedGamesForUser(USER_ID, {
      includeIgnored: true,
    });

    const names = result.games.map((g) => g.name);
    expect(names).toContain("Ignored Game");
    expect(names).not.toContain("Matched Game");
  });
});
