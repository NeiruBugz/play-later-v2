import { getServerUserId } from "@/auth";
import {
  cleanupDatabase,
  getTestDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";
import { createGame, createUser } from "@/test/setup/db-factories";

import { AcquisitionType, LibraryItemStatus } from "@/shared/types/library";

import { quickAddToLibraryAction } from "./quick-add-to-library-action";

const {
  mockGetGameDetails,
  MockIgdbService,
  mockPopulateGameInDatabase,
  MockGameDetailService,
} = vi.hoisted(() => {
  const mockFn = vi.fn();
  const mockPopulate = vi.fn();

  return {
    mockGetGameDetails: mockFn,
    MockIgdbService: class {
      async getGameDetails(...args: unknown[]) {
        return mockFn(...args);
      }
    },
    mockPopulateGameInDatabase: mockPopulate,
    MockGameDetailService: class {
      async populateGameInDatabase(...args: unknown[]) {
        return mockPopulate(...args);
      }
    },
  };
});

vi.mock("@/data-access-layer/services/igdb/igdb-service", () => ({
  IgdbService: MockIgdbService,
}));

vi.mock("@/data-access-layer/services/game-detail/game-detail-service", () => ({
  GameDetailService: MockGameDetailService,
}));

beforeAll(async () => {
  await setupDatabase();
});

afterAll(async () => {
  await cleanupDatabase();
});

describe("quickAddToLibraryAction - Integration Tests", () => {
  let testUser: Awaited<ReturnType<typeof createUser>>;
  let testGame: Awaited<ReturnType<typeof createGame>>;

  const igdbPcId = 6;
  const igdbPs5Id = 167;
  const igdbXboxSeriesId = 169;

  beforeEach(async () => {
    await resetTestDatabase();
    vi.clearAllMocks();

    const db = getTestDatabase();
    await db.platform.createMany({
      data: [
        {
          igdbId: igdbPcId,
          name: "PC",
          slug: "pc",
        },
        {
          igdbId: igdbPs5Id,
          name: "PlayStation 5",
          slug: "playstation-5",
        },
      ],
    });

    mockGetGameDetails.mockResolvedValue({
      game: {
        id: 12345,
        name: "Existing Game",
        slug: "existing-game",
        summary: "A test game",
        cover: { image_id: "cover123" },
        first_release_date: 1609459200,
        genres: [],
        platforms: [
          { id: igdbXboxSeriesId, name: "Xbox Series X|S" },
          { id: igdbPs5Id, name: "PlayStation 5" },
          { id: igdbPcId, name: "PC" },
        ],
      },
    });

    mockPopulateGameInDatabase.mockImplementation(async (game) => {
      const createdGame = await db.game.create({
        data: {
          title: game.name,
          igdbId: game.id,
          slug: game.slug,
          description: game.summary,
        },
      });
      return { success: true, data: createdGame };
    });

    testUser = await createUser({
      email: "test@example.com",
      username: "testuser",
    });

    testGame = await createGame({
      title: "Existing Game",
      igdbId: 12345,
    });

    vi.mocked(getServerUserId).mockResolvedValue(testUser.id);
  });

  it("defaults status to UP_NEXT, acquisitionType to DIGITAL, and resolves platform via auto-detect", async () => {
    const result = await quickAddToLibraryAction({
      igdbId: testGame.igdbId,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.userId).toBe(testUser.id);
    expect(result.data.gameId).toBe(testGame.id);
    expect(result.data.status).toBe(LibraryItemStatus.UP_NEXT);
    expect(result.data.acquisitionType).toBe(AcquisitionType.DIGITAL);
    // PS5 comes before PC in IGDB platforms, both are known. Xbox Series is first
    // but it is not in the local Platform table, so we fall through to PS5.
    expect(result.data.platform).toBe("PlayStation 5");

    const dbItem = await getTestDatabase().libraryItem.findUnique({
      where: { id: result.data.id },
    });
    expect(dbItem?.status).toBe(LibraryItemStatus.UP_NEXT);
    expect(dbItem?.acquisitionType).toBe(AcquisitionType.DIGITAL);
    expect(dbItem?.platform).toBe("PlayStation 5");
  });

  it("returns the existing item without erroring on duplicate quick-add", async () => {
    const first = await quickAddToLibraryAction({
      igdbId: testGame.igdbId,
    });
    expect(first.success).toBe(true);
    if (!first.success) return;

    const second = await quickAddToLibraryAction({
      igdbId: testGame.igdbId,
    });

    expect(second.success).toBe(true);
    if (!second.success) return;

    expect(second.data.id).toBe(first.data.id);

    const items = await getTestDatabase().libraryItem.findMany({
      where: { userId: testUser.id, gameId: testGame.id },
    });
    expect(items).toHaveLength(1);
  });
});
