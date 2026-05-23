/**
 * RED integration test for importSteamLibraryWorker (Slice 21 Phase C).
 *
 * Worker signature (locked):
 *   importSteamLibraryWorker(
 *     userId: string | undefined,
 *   ): Promise<{ imported: number; total: number }>
 *
 * Behaviour contract (mirrors canonical `fetchSteamGamesHandler`):
 *   - userId === undefined          → throws UnauthorizedError, no DB write.
 *   - user has no steamId64         → throws ValidationError, no DB write.
 *   - Steam returns games           → upserts ImportedGame rows with
 *                                     `storefront: STEAM`, `igdbMatchStatus: PENDING`.
 *   - Re-run with same payload      → idempotent: existing rows updated, no
 *                                     duplicates inserted.
 *   - Re-run with new game added    → new row inserted, existing updated.
 *   - Steam error (e.g. private)    → re-thrown as-is (UpstreamError subclass),
 *                                     no partial write.
 *
 * NOTE on slice-spec wording: the spec calls for "matches via IGDB by
 * name+platform (best-effort)" during import, but the canonical behavior
 * (verified in `savepoint-app/data-access-layer/handlers/steam-import/
 * fetch-steam-games.handler.ts`) is to save all rows with
 * `igdbMatchStatus: PENDING` and defer matching to downstream flows.
 * This Phase mirrors canonical — divergence documented in DIVERGENCES.md.
 */
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// RED import — module does not exist until the GREEN step.
import { importSteamLibraryWorker } from "@/features/steam-import/api/import-steam-library.worker";
import { SteamProfilePrivateError } from "@/shared/api/steam";
import { UnauthorizedError, ValidationError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("import-steam-library");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CONNECTED_USER_ID = "isl-user-alice";
const UNCONNECTED_USER_ID = "isl-user-bob";
const STEAM_ID_64 = "76561198012345678";

beforeEach(async () => {
  await db.prisma.importedGame.deleteMany();
  await db.prisma.user.deleteMany();
  await db.prisma.user.create({
    data: {
      id: CONNECTED_USER_ID,
      email: "isl-alice@example.com",
      name: "ISL Alice",
      emailVerified: true,
      steamId64: STEAM_ID_64,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
  await db.prisma.user.create({
    data: {
      id: UNCONNECTED_USER_ID,
      email: "isl-bob@example.com",
      name: "ISL Bob",
      emailVerified: true,
      steamId64: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
});

// ---------------------------------------------------------------------------
// Steam fetch stub helpers
// ---------------------------------------------------------------------------

interface RawSteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
  img_icon_url?: string;
  img_logo_url?: string;
  rtime_last_played?: number;
}

function stubOwnedGames(games: RawSteamGame[]): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      // Only the GetOwnedGames endpoint is called by the worker.
      if (!url.includes("GetOwnedGames")) {
        throw new Error(`Unexpected Steam endpoint: ${url}`);
      }
      return new Response(
        JSON.stringify({
          response: { game_count: games.length, games },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    })
  );
}

function stubPrivateProfile(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          // `game_count > 0` + no `games` array → SteamProfilePrivateError
          JSON.stringify({ response: { game_count: 42 } }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
    )
  );
}

const THREE_GAMES: RawSteamGame[] = [
  {
    appid: 730,
    name: "Counter-Strike 2",
    playtime_forever: 1200,
    playtime_windows_forever: 1200,
    playtime_mac_forever: 0,
    playtime_linux_forever: 0,
    img_icon_url: "abc",
    img_logo_url: "def",
    rtime_last_played: 1_700_000_000,
  },
  {
    appid: 440,
    name: "Team Fortress 2",
    playtime_forever: 0,
    playtime_windows_forever: 0,
    playtime_mac_forever: 0,
    playtime_linux_forever: 0,
  },
  {
    appid: 570,
    name: "Dota 2",
    playtime_forever: 600,
    playtime_windows_forever: 600,
    playtime_mac_forever: 0,
    playtime_linux_forever: 0,
    rtime_last_played: 1_700_500_000,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("importSteamLibraryWorker", () => {
  describe("auth gate", () => {
    it("throws UnauthorizedError when userId is undefined", async () => {
      stubOwnedGames(THREE_GAMES);
      await expect(importSteamLibraryWorker(undefined)).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("does not write rows when unauthenticated", async () => {
      stubOwnedGames(THREE_GAMES);
      await expect(importSteamLibraryWorker(undefined)).rejects.toThrow(
        UnauthorizedError
      );
      const count = await db.prisma.importedGame.count();
      expect(count).toBe(0);
    });
  });

  describe("missing Steam connection", () => {
    it("throws ValidationError when the user has no steamId64", async () => {
      stubOwnedGames(THREE_GAMES);
      await expect(
        importSteamLibraryWorker(UNCONNECTED_USER_ID)
      ).rejects.toThrow(ValidationError);
    });

    it("does not write rows when steamId64 is missing", async () => {
      stubOwnedGames(THREE_GAMES);
      await expect(
        importSteamLibraryWorker(UNCONNECTED_USER_ID)
      ).rejects.toThrow(ValidationError);
      const count = await db.prisma.importedGame.count({
        where: { userId: UNCONNECTED_USER_ID },
      });
      expect(count).toBe(0);
    });
  });

  describe("happy path — 3 games", () => {
    beforeEach(() => {
      stubOwnedGames(THREE_GAMES);
    });

    it("returns { imported: 3, total: 3 }", async () => {
      const result = await importSteamLibraryWorker(CONNECTED_USER_ID);
      expect(result).toEqual({ imported: 3, total: 3 });
    });

    it("writes 3 ImportedGame rows with storefront=STEAM and igdbMatchStatus=PENDING", async () => {
      await importSteamLibraryWorker(CONNECTED_USER_ID);
      const rows = await db.prisma.importedGame.findMany({
        where: { userId: CONNECTED_USER_ID },
      });
      expect(rows).toHaveLength(3);
      expect(rows.every((r) => r.storefront === "STEAM")).toBe(true);
      expect(rows.every((r) => r.igdbMatchStatus === "PENDING")).toBe(true);
    });

    it("preserves Steam appId in storefrontGameId as string", async () => {
      await importSteamLibraryWorker(CONNECTED_USER_ID);
      const rows = await db.prisma.importedGame.findMany({
        where: { userId: CONNECTED_USER_ID },
        orderBy: { storefrontGameId: "asc" },
      });
      expect(rows.map((r) => r.storefrontGameId).sort()).toEqual([
        "440",
        "570",
        "730",
      ]);
    });

    it("maps playtime_forever onto playtime", async () => {
      await importSteamLibraryWorker(CONNECTED_USER_ID);
      const cs2 = await db.prisma.importedGame.findFirst({
        where: { userId: CONNECTED_USER_ID, storefrontGameId: "730" },
      });
      expect(cs2?.playtime).toBe(1200);
    });

    it("maps rtime_last_played onto lastPlayedAt", async () => {
      await importSteamLibraryWorker(CONNECTED_USER_ID);
      const cs2 = await db.prisma.importedGame.findFirst({
        where: { userId: CONNECTED_USER_ID, storefrontGameId: "730" },
      });
      expect(cs2?.lastPlayedAt?.getTime()).toBe(1_700_000_000 * 1000);
    });

    it("leaves lastPlayedAt null when rtime_last_played is absent", async () => {
      await importSteamLibraryWorker(CONNECTED_USER_ID);
      const tf2 = await db.prisma.importedGame.findFirst({
        where: { userId: CONNECTED_USER_ID, storefrontGameId: "440" },
      });
      expect(tf2?.lastPlayedAt).toBeNull();
    });
  });

  describe("idempotency", () => {
    it("re-running with the same payload inserts no duplicates", async () => {
      stubOwnedGames(THREE_GAMES);
      await importSteamLibraryWorker(CONNECTED_USER_ID);
      vi.unstubAllGlobals();
      stubOwnedGames(THREE_GAMES);
      await importSteamLibraryWorker(CONNECTED_USER_ID);
      const count = await db.prisma.importedGame.count({
        where: { userId: CONNECTED_USER_ID },
      });
      expect(count).toBe(3);
    });

    it("re-running with new game inserts new row and updates existing", async () => {
      stubOwnedGames(THREE_GAMES);
      await importSteamLibraryWorker(CONNECTED_USER_ID);
      vi.unstubAllGlobals();

      // Second fetch: playtime updated for game #1, plus one new game.
      const updated: RawSteamGame[] = [
        { ...THREE_GAMES[0], playtime_forever: 5000 },
        THREE_GAMES[1],
        THREE_GAMES[2],
        {
          appid: 4000,
          name: "Garry's Mod",
          playtime_forever: 100,
        },
      ];
      stubOwnedGames(updated);
      const result = await importSteamLibraryWorker(CONNECTED_USER_ID);
      expect(result.total).toBe(4);
      const rows = await db.prisma.importedGame.findMany({
        where: { userId: CONNECTED_USER_ID },
      });
      expect(rows).toHaveLength(4);
      const cs2 = rows.find((r) => r.storefrontGameId === "730");
      expect(cs2?.playtime).toBe(5000);
    });
  });

  describe("Steam profile private", () => {
    beforeEach(() => {
      stubPrivateProfile();
    });

    it("re-throws SteamProfilePrivateError", async () => {
      await expect(importSteamLibraryWorker(CONNECTED_USER_ID)).rejects.toThrow(
        SteamProfilePrivateError
      );
    });

    it("writes no rows on private profile", async () => {
      await expect(importSteamLibraryWorker(CONNECTED_USER_ID)).rejects.toThrow(
        SteamProfilePrivateError
      );
      const count = await db.prisma.importedGame.count({
        where: { userId: CONNECTED_USER_ID },
      });
      expect(count).toBe(0);
    });
  });
});
