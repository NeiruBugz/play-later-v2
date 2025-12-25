import {
  AcquisitionType,
  LibraryItemStatus,
  type LibraryItemWithGameDomain,
} from "@/shared/types";
import type { UniquePlatformResult } from "@/shared/types/platform";

export function createLibraryItemFixture(
  overrides?: Partial<LibraryItemWithGameDomain>
): LibraryItemWithGameDomain {
  return {
    id: 1,
    userId: "user-123",
    gameId: "game-123",
    status: LibraryItemStatus.PLAYING,
    platform: "PlayStation 5",
    acquisitionType: AcquisitionType.DIGITAL,
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
      entryCount: 1,
    },
    ...overrides,
  };
}

export const libraryItemsFixture: LibraryItemWithGameDomain[] = [
  {
    id: 1,
    userId: "user-123",
    gameId: "game-1",
    status: LibraryItemStatus.WANT_TO_PLAY,
    platform: "PC (Windows)",
    acquisitionType: AcquisitionType.DIGITAL,
    startedAt: null,
    completedAt: null,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    game: {
      id: "game-1",
      title: "The Witcher 3: Wild Hunt",
      coverImage:
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg",
      slug: "the-witcher-3-wild-hunt",
      releaseDate: new Date("2015-05-19"),
      entryCount: 1,
    },
  },
  {
    id: 2,
    userId: "user-123",
    gameId: "game-2",
    status: LibraryItemStatus.PLAYING,
    platform: "PlayStation 5",
    acquisitionType: AcquisitionType.DIGITAL,
    startedAt: new Date("2024-01-12"),
    completedAt: null,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-12"),
    game: {
      id: "game-2",
      title: "Elden Ring",
      coverImage:
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg",
      slug: "elden-ring",
      releaseDate: new Date("2022-02-25"),
      entryCount: 1,
    },
  },
  {
    id: 3,
    userId: "user-123",
    gameId: "game-3",
    status: LibraryItemStatus.PLAYED,
    platform: "PC (Windows)",
    acquisitionType: AcquisitionType.DIGITAL,
    startedAt: new Date("2024-01-06"),
    completedAt: new Date("2024-01-20"),
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-20"),
    game: {
      id: "game-3",
      title: "Hades",
      coverImage:
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co2i0v.jpg",
      slug: "hades",
      releaseDate: new Date("2020-09-17"),
      entryCount: 1,
    },
  },
  {
    id: 4,
    userId: "user-123",
    gameId: "game-4",
    status: LibraryItemStatus.WANT_TO_PLAY,
    platform: "Nintendo Switch",
    acquisitionType: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date("2024-01-18"),
    updatedAt: new Date("2024-01-18"),
    game: {
      id: "game-4",
      title: "The Legend of Zelda: Tears of the Kingdom",
      coverImage:
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co5rmg.jpg",
      slug: "the-legend-of-zelda-tears-of-the-kingdom",
      releaseDate: new Date("2023-05-12"),
      entryCount: 1,
    },
  },
  {
    id: 5,
    userId: "user-123",
    gameId: "game-5",
    status: LibraryItemStatus.PLAYED,
    platform: "PlayStation 5",
    acquisitionType: AcquisitionType.PHYSICAL,
    startedAt: new Date("2024-01-08"),
    completedAt: null,
    createdAt: new Date("2024-01-07"),
    updatedAt: new Date("2024-01-14"),
    game: {
      id: "game-5",
      title: "Horizon Forbidden West",
      coverImage:
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co3pv2.jpg",
      slug: "horizon-forbidden-west",
      releaseDate: new Date("2022-02-18"),
      entryCount: 1,
    },
  },
  {
    id: 6,
    userId: "user-123",
    gameId: "game-6",
    status: LibraryItemStatus.PLAYING,
    platform: "PC (Windows)",
    acquisitionType: AcquisitionType.DIGITAL,
    startedAt: new Date("2024-01-22"),
    completedAt: null,
    createdAt: new Date("2023-12-01"),
    updatedAt: new Date("2024-01-22"),
    game: {
      id: "game-6",
      title: "Dark Souls III",
      coverImage:
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7l.jpg",
      slug: "dark-souls-iii",
      releaseDate: new Date("2016-04-12"),
      entryCount: 2,
    },
  },
];

export const uniquePlatformsFixture: UniquePlatformResult[] = [
  { id: "plat-1", name: "PC (Windows)", slug: "win" },
  { id: "plat-2", name: "PlayStation 5", slug: "ps5" },
  { id: "plat-3", name: "Nintendo Switch", slug: "switch" },
];

export const emptyLibraryFixture: LibraryItemWithGameDomain[] = [];
