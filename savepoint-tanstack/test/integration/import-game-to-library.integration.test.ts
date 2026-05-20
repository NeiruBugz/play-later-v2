/**
 * Integration tests for features/steam-import/api/import-game-to-library.worker.
 *
 * Drives the worker directly (foot-gun #8 — the `createServerFn` wrapper
 * needs the Start runtime). IGDB transport is mocked so the test stays
 * hermetic; the real cache-or-fetch path is exercised via the mocked
 * `getGameByIgdbId`.
 */
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { NeedsManualMatchError } from "@/features/steam-import/api/errors";
import { importGameToLibraryWorker } from "@/features/steam-import/api/import-game-to-library.worker";
import { getGameByIgdbId, matchSteamGameByAppId } from "@/shared/api/igdb";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

vi.mock("@/shared/api/igdb", async () => {
  const actual =
    await vi.importActual<typeof import("@/shared/api/igdb")>(
      "@/shared/api/igdb"
    );
  return {
    ...actual,
    getGameByIgdbId: vi.fn(),
    matchSteamGameByAppId: vi.fn(),
  };
});

const getGameByIgdbIdMock = getGameByIgdbId as ReturnType<typeof vi.fn>;
const matchSteamGameMock = matchSteamGameByAppId as ReturnType<typeof vi.fn>;

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("import-game-to-library");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const ALICE_ID = "igtl-alice";
const BOB_ID = "igtl-bob";

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.importedGame.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.createMany({
    data: [
      {
        id: ALICE_ID,
        email: "igtl-alice@example.com",
        name: "Alice",
        emailVerified: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        id: BOB_ID,
        email: "igtl-bob@example.com",
        name: "Bob",
        emailVerified: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ],
  });

  getGameByIgdbIdMock.mockReset();
  matchSteamGameMock.mockReset();
});

async function createImported(
  userId: string,
  overrides?: Partial<{ name: string; storefrontGameId: string }>
) {
  const row = await db.prisma.importedGame.create({
    data: {
      userId,
      name: overrides?.name ?? "Test Game",
      storefront: "STEAM",
      storefrontGameId: overrides?.storefrontGameId ?? "12345",
      igdbMatchStatus: "PENDING",
    },
  });
  return row;
}

describe("importGameToLibraryWorker", () => {
  describe("given no userId", () => {
    it("throws UnauthorizedError", async () => {
      await expect(
        importGameToLibraryWorker(undefined, {
          importedGameId: "any",
          status: "SHELF",
        })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe("given an imported-game row belonging to another user", () => {
    let bobsRowId: string;
    beforeEach(async () => {
      const row = await createImported(BOB_ID);
      bobsRowId = row.id;
    });

    it("throws NotFoundError for the privacy invariant", async () => {
      await expect(
        importGameToLibraryWorker(ALICE_ID, {
          importedGameId: bobsRowId,
          status: "SHELF",
          manualIgdbId: 1,
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given no manualIgdbId and the auto-matcher finds a match", () => {
    let importedId: string;
    beforeEach(async () => {
      const row = await createImported(ALICE_ID, { storefrontGameId: "220" });
      importedId = row.id;
      matchSteamGameMock.mockResolvedValue({
        id: 1234,
        name: "Half-Life 2",
        slug: "half-life-2",
        first_release_date: 1099267200,
      });
    });

    it("auto-matches via Steam App ID and creates a LibraryItem", async () => {
      const result = await importGameToLibraryWorker(ALICE_ID, {
        importedGameId: importedId,
        status: "PLAYED",
      });
      expect(matchSteamGameMock).toHaveBeenCalledWith("220");
      expect(result.gameSlug).toBe("half-life-2");
      const row = await db.prisma.importedGame.findUnique({
        where: { id: importedId },
      });
      expect(row?.igdbMatchStatus).toBe("MATCHED");
    });

    it("does NOT call getGameByIgdbId — auto-match payload is sufficient", async () => {
      await importGameToLibraryWorker(ALICE_ID, {
        importedGameId: importedId,
        status: "PLAYED",
      });
      expect(getGameByIgdbIdMock).not.toHaveBeenCalled();
    });
  });

  describe("given no manualIgdbId and the auto-matcher returns null", () => {
    let importedId: string;
    beforeEach(async () => {
      const row = await createImported(ALICE_ID, { storefrontGameId: "999" });
      importedId = row.id;
      matchSteamGameMock.mockResolvedValue(null);
    });

    it("throws NeedsManualMatchError", async () => {
      await expect(
        importGameToLibraryWorker(ALICE_ID, {
          importedGameId: importedId,
          status: "SHELF",
        })
      ).rejects.toBeInstanceOf(NeedsManualMatchError);
    });

    it("flips the imported-game status to UNMATCHED so the row leaves PENDING", async () => {
      try {
        await importGameToLibraryWorker(ALICE_ID, {
          importedGameId: importedId,
          status: "SHELF",
        });
      } catch {
        // expected
      }
      const row = await db.prisma.importedGame.findUnique({
        where: { id: importedId },
      });
      expect(row?.igdbMatchStatus).toBe("UNMATCHED");
    });
  });

  describe("given manualIgdbId for a game already cached locally", () => {
    let importedId: string;
    beforeEach(async () => {
      const row = await createImported(ALICE_ID);
      importedId = row.id;
      await db.prisma.game.create({
        data: {
          igdbId: 555,
          title: "Cached Title",
          slug: "cached-title",
        },
      });
    });

    it("creates a LibraryItem and flips status to MATCHED without hitting IGDB", async () => {
      const result = await importGameToLibraryWorker(ALICE_ID, {
        importedGameId: importedId,
        status: "PLAYED",
        manualIgdbId: 555,
      });

      expect(result.gameSlug).toBe("cached-title");
      expect(getGameByIgdbIdMock).not.toHaveBeenCalled();

      const item = await db.prisma.libraryItem.findUnique({
        where: { id: result.libraryItemId },
      });
      expect(item?.status).toBe("PLAYED");
      expect(item?.userId).toBe(ALICE_ID);

      const row = await db.prisma.importedGame.findUnique({
        where: { id: importedId },
      });
      expect(row?.igdbMatchStatus).toBe("MATCHED");
    });
  });

  describe("given manualIgdbId for a game NOT in the local cache", () => {
    let importedId: string;
    beforeEach(async () => {
      const row = await createImported(ALICE_ID);
      importedId = row.id;
      getGameByIgdbIdMock.mockResolvedValue({
        id: 777,
        name: "Remote Game",
        slug: "remote-game",
        first_release_date: 1577836800,
        cover: { image_id: "abc123" },
      });
    });

    it("fetches from IGDB and persists a new Game row", async () => {
      const result = await importGameToLibraryWorker(ALICE_ID, {
        importedGameId: importedId,
        status: "UP_NEXT",
        manualIgdbId: 777,
      });

      expect(getGameByIgdbIdMock).toHaveBeenCalledWith(777);
      const game = await db.prisma.game.findUnique({
        where: { igdbId: 777 },
      });
      expect(game?.title).toBe("Remote Game");
      expect(game?.slug).toBe("remote-game");
      expect(result.gameSlug).toBe("remote-game");
    });
  });

  describe("given manualIgdbId for a game IGDB does not know", () => {
    let importedId: string;
    beforeEach(async () => {
      const row = await createImported(ALICE_ID);
      importedId = row.id;
      getGameByIgdbIdMock.mockResolvedValue(undefined);
    });

    it("throws NotFoundError", async () => {
      await expect(
        importGameToLibraryWorker(ALICE_ID, {
          importedGameId: importedId,
          status: "SHELF",
          manualIgdbId: 99999,
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given the user already has the game in their library", () => {
    let importedId: string;
    beforeEach(async () => {
      const row = await createImported(ALICE_ID);
      importedId = row.id;
      const game = await db.prisma.game.create({
        data: {
          igdbId: 42,
          title: "Already Owned",
          slug: "already-owned",
        },
      });
      await db.prisma.libraryItem.create({
        data: {
          userId: ALICE_ID,
          gameId: game.id,
          status: "SHELF",
        },
      });
    });

    it("throws ConflictError", async () => {
      await expect(
        importGameToLibraryWorker(ALICE_ID, {
          importedGameId: importedId,
          status: "PLAYING",
          manualIgdbId: 42,
        })
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("still flips the imported-game status to MATCHED", async () => {
      try {
        await importGameToLibraryWorker(ALICE_ID, {
          importedGameId: importedId,
          status: "PLAYING",
          manualIgdbId: 42,
        });
      } catch {
        // expected ConflictError
      }
      const row = await db.prisma.importedGame.findUnique({
        where: { id: importedId },
      });
      expect(row?.igdbMatchStatus).toBe("MATCHED");
    });
  });
});
