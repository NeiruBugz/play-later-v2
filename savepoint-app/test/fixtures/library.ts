import type { LibraryItemWithGameAndCount } from "@/shared/types";

export function createLibraryItemFixture(
  overrides?: Partial<LibraryItemWithGameAndCount>
): LibraryItemWithGameAndCount {
  return {
    id: 1,
    userId: "user-123",
    gameId: "game-123",
    status: "CURRENTLY_EXPLORING",
    platform: "PlayStation 5",
    acquisitionType: "DIGITAL",
    startedAt: new Date("2025-01-15"),
    completedAt: null,
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-20"),
    game: {
      id: "game-123",
      title: "The Legend of Zelda: Breath of the Wild",
      coverImage:
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg",
      slug: "the-legend-of-zelda-breath-of-the-wild",
      releaseDate: new Date("2017-03-03"),
      _count: {
        libraryItems: 1,
      },
    },
    ...overrides,
  };
}
