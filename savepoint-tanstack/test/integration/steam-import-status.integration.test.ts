import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { importGameToLibraryWorker } from "@/features/steam-import/api/import-game-to-library.worker";
import { matchSteamGameByAppId } from "@/shared/api/igdb";

import { createUser } from "../factories/index.ts";
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

const matchSteamGameMock = matchSteamGameByAppId as ReturnType<typeof vi.fn>;

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("steam-import-status");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.playthrough.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.importedGame.deleteMany();
  await db.prisma.user.deleteMany();
  matchSteamGameMock.mockReset();
  matchSteamGameMock.mockResolvedValue({
    id: 4321,
    name: "Portal",
    slug: "portal",
    first_release_date: 1191974400,
  });
});

async function importWith(status: "WANT" | "PLAYING" | "DONE") {
  const user = await createUser(db.prisma);
  const imported = await db.prisma.importedGame.create({
    data: {
      userId: user.id,
      name: "Portal",
      storefront: "STEAM",
      storefrontGameId: "400",
      igdbMatchStatus: "PENDING",
    },
  });
  const result = await importGameToLibraryWorker(user.id, {
    importedGameId: imported.id,
    status,
  });
  const item = await db.prisma.libraryItem.findUniqueOrThrow({
    where: { id: result.libraryItemId },
    include: { playthroughs: true },
  });
  return item;
}

describe("importGameToLibraryWorker status handling", () => {
  describe("given the user confirms Playing", () => {
    it("creates a PLAYING item with one open play", async () => {
      const item = await importWith("PLAYING");
      expect(item.status).toBe("PLAYING");
      expect(item.playthroughs).toHaveLength(1);
      expect(item.playthroughs[0]?.finishedAt).toBeNull();
    });
  });

  describe("given the user confirms Want", () => {
    it("creates a WANT item with no play", async () => {
      const item = await importWith("WANT");
      expect(item.status).toBe("WANT");
      expect(item.playthroughs).toHaveLength(0);
    });
  });

  describe("given the user confirms Done", () => {
    it("creates a DONE item with no open play", async () => {
      const item = await importWith("DONE");
      expect(item.status).toBe("DONE");
      expect(item.playthroughs).toHaveLength(0);
    });
  });
});
