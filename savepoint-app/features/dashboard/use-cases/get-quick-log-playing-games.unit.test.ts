import { JournalService } from "@/data-access-layer/services/journal/journal-service";
import { LibraryService } from "@/data-access-layer/services/library/library-service";

import { getQuickLogPlayingGames } from "./get-quick-log-playing-games";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/data-access-layer/services/library/library-service");

vi.mock("@/data-access-layer/services/journal/journal-service");

function makeLibraryItem(
  gameId: string,
  overrides: {
    startedAt?: Date | null;
    updatedAt?: Date;
  } = {}
) {
  return {
    id: 1,
    userId: "user-1",
    gameId,
    status: "PLAYING" as const,
    startedAt: overrides.startedAt ?? null,
    updatedAt: overrides.updatedAt ?? new Date("2025-01-01"),
    createdAt: new Date("2025-01-01"),
    rating: null,
    hasBeenPlayed: false,
    platform: null,
    platformId: null,
    acquisitionType: "DIGITAL" as const,
    completedAt: null,
    statusChangedAt: null,
    game: {
      id: gameId,
      igdbId: 1,
      title: `Game ${gameId}`,
      coverImage: null,
      slug: `game-${gameId}`,
      releaseDate: null,
      _count: { libraryItems: 1 },
    },
  };
}

describe("getQuickLogPlayingGames", () => {
  const userId = "user-1";

  let mockGetLibraryItems: ReturnType<typeof vi.fn>;
  let mockGetLatestEntryDatePerGame: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetLibraryItems = vi.fn();
    mockGetLatestEntryDatePerGame = vi.fn();

    vi.mocked(LibraryService).mockImplementation(function () {
      return {
        getLibraryItems: mockGetLibraryItems,
      } as unknown as LibraryService;
    });

    vi.mocked(JournalService).mockImplementation(function () {
      return {
        getLatestEntryDatePerGame: mockGetLatestEntryDatePerGame,
      } as unknown as JournalService;
    });
  });

  it("returns empty array when no playing games", async () => {
    mockGetLibraryItems.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, hasMore: false },
    });
    mockGetLatestEntryDatePerGame.mockResolvedValue({
      success: true,
      data: new Map(),
    });

    const result = await getQuickLogPlayingGames(userId);
    expect(result).toEqual([]);
  });

  it("returns empty array when library service fails", async () => {
    mockGetLibraryItems.mockResolvedValue({
      success: false,
      error: "DB error",
    });

    const result = await getQuickLogPlayingGames(userId);
    expect(result).toEqual([]);
  });

  it("sorts by latestJournal date when journal is most recent", async () => {
    const updatedAtA = new Date("2025-01-01T10:00:00Z");
    const updatedAtB = new Date("2025-01-02T10:00:00Z");

    mockGetLibraryItems.mockResolvedValue({
      success: true,
      data: {
        items: [
          makeLibraryItem("game-a", { updatedAt: updatedAtA }),
          makeLibraryItem("game-b", { updatedAt: updatedAtB }),
        ],
        total: 2,
        hasMore: false,
      },
    });

    const journalDateA = new Date("2025-01-10T10:00:00Z");

    mockGetLatestEntryDatePerGame.mockResolvedValue({
      success: true,
      data: new Map([["game-a", journalDateA]]),
    });

    const result = await getQuickLogPlayingGames(userId);

    expect(result[0].id).toBe("game-a");
    expect(result[1].id).toBe("game-b");
  });

  it("sorts by startedAt when it is the most recent date", async () => {
    const startedAtA = new Date("2025-03-01T10:00:00Z");
    const updatedAtB = new Date("2025-02-01T10:00:00Z");

    mockGetLibraryItems.mockResolvedValue({
      success: true,
      data: {
        items: [
          makeLibraryItem("game-a", {
            startedAt: startedAtA,
            updatedAt: new Date("2025-01-01"),
          }),
          makeLibraryItem("game-b", { updatedAt: updatedAtB }),
        ],
        total: 2,
        hasMore: false,
      },
    });

    mockGetLatestEntryDatePerGame.mockResolvedValue({
      success: true,
      data: new Map(),
    });

    const result = await getQuickLogPlayingGames(userId);

    expect(result[0].id).toBe("game-a");
    expect(result[1].id).toBe("game-b");
  });

  it("breaks ties with updatedAt descending", async () => {
    const sameJournalDate = new Date("2025-01-10T10:00:00Z");
    const updatedAtA = new Date("2025-01-08T10:00:00Z");
    const updatedAtB = new Date("2025-01-09T10:00:00Z");

    mockGetLibraryItems.mockResolvedValue({
      success: true,
      data: {
        items: [
          makeLibraryItem("game-a", { updatedAt: updatedAtA }),
          makeLibraryItem("game-b", { updatedAt: updatedAtB }),
        ],
        total: 2,
        hasMore: false,
      },
    });

    mockGetLatestEntryDatePerGame.mockResolvedValue({
      success: true,
      data: new Map([
        ["game-a", sameJournalDate],
        ["game-b", sameJournalDate],
      ]),
    });

    const result = await getQuickLogPlayingGames(userId);

    expect(result[0].id).toBe("game-b");
    expect(result[1].id).toBe("game-a");
  });

  it("limits result to 3 games", async () => {
    const items = ["a", "b", "c", "d", "e"].map((id, index) =>
      makeLibraryItem(`game-${id}`, {
        updatedAt: new Date(`2025-01-0${index + 1}`),
      })
    );

    mockGetLibraryItems.mockResolvedValue({
      success: true,
      data: { items, total: 5, hasMore: false },
    });

    mockGetLatestEntryDatePerGame.mockResolvedValue({
      success: true,
      data: new Map(),
    });

    const result = await getQuickLogPlayingGames(userId);

    expect(result).toHaveLength(3);
  });

  it("falls back to library timestamps when journal service fails", async () => {
    const updatedAtA = new Date("2025-01-05T10:00:00Z");
    const updatedAtB = new Date("2025-01-01T10:00:00Z");

    mockGetLibraryItems.mockResolvedValue({
      success: true,
      data: {
        items: [
          makeLibraryItem("game-a", { updatedAt: updatedAtA }),
          makeLibraryItem("game-b", { updatedAt: updatedAtB }),
        ],
        total: 2,
        hasMore: false,
      },
    });

    mockGetLatestEntryDatePerGame.mockResolvedValue({
      success: false,
      error: "DB error",
    });

    const result = await getQuickLogPlayingGames(userId);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("game-a");
    expect(result[1].id).toBe("game-b");
  });

  it("returns correct shape for each game", async () => {
    const item = makeLibraryItem("game-x", {
      startedAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-10"),
    });
    item.game.title = "My Game";
    item.game.slug = "my-game";

    mockGetLibraryItems.mockResolvedValue({
      success: true,
      data: { items: [item], total: 1, hasMore: false },
    });

    mockGetLatestEntryDatePerGame.mockResolvedValue({
      success: true,
      data: new Map(),
    });

    const result = await getQuickLogPlayingGames(userId);

    expect(result[0]).toMatchObject({
      id: "game-x",
      title: "My Game",
      slug: "my-game",
    });
    expect(result[0].latestActivityAt).toBeInstanceOf(Date);
  });
});
