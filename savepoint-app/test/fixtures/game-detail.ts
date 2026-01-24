import type { LibraryItem } from "@prisma/client";

import type { FullGameInfoResponse } from "@/shared/types";

export function createFullGameFixture(
  overrides?: Partial<FullGameInfoResponse>
): FullGameInfoResponse {
  return {
    id: 12345,
    name: "The Legend of Zelda: Breath of the Wild",
    slug: "the-legend-of-zelda-breath-of-the-wild",
    summary: "An open-world adventure",
    cover: { image_id: "co1wyc" },
    first_release_date: 1488326400,
    genres: [{ id: 12, name: "Role-playing (RPG)" }],
    platforms: [{ id: 130, name: "Nintendo Switch" }],
    franchise: 169,
    franchises: [169, 234],
    ...overrides,
  } as FullGameInfoResponse;
}

export function createSimpleLibraryItemFixture(
  overrides?: Partial<LibraryItem>
): LibraryItem {
  return {
    id: 1,
    userId: "user-123",
    gameId: "game-456",
    status: "PLAYING",
    platform: "Nintendo Switch",
    acquisitionType: "DIGITAL",
    startedAt: new Date("2025-01-01"),
    completedAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-02"),
    ...overrides,
  };
}

export function createFranchiseGamesFixture() {
  return [
    {
      id: 1942,
      name: "The Legend of Zelda: Breath of the Wild",
      slug: "the-legend-of-zelda-breath-of-the-wild",
      cover: { image_id: "co1wyc" },
    },
    {
      id: 119171,
      name: "The Legend of Zelda: Tears of the Kingdom",
      slug: "the-legend-of-zelda-tears-of-the-kingdom",
      cover: { image_id: "co5rmg" },
    },
  ];
}

export function createDatabaseGameFixture(overrides?: {
  id?: string;
  igdbId?: number;
  slug?: string;
  title?: string;
}) {
  const baseGame = {
    id: "game-456",
    igdbId: 12345,
    slug: "test-game",
    title: "Test Game",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    hltbId: null,
    description: "A test game description",
    coverImage: "test-cover.jpg",
    releaseDate: new Date("2023-01-15"),
    firstReleaseDate: new Date("2023-01-15"),
    aggregatedRating: 85.5,
    storyline: null,
    url: null,
    websites: [],
    franchiseId: null,
    mainStory: null,
    mainExtra: null,
    completionist: null,
    steamAppId: null,
    genres: [] as Array<{ genre: { id: string; name: string; slug: string } }>,
    platforms: [] as Array<{
      platform: { id: string; name: string; slug: string };
    }>,
    ...overrides,
  };
  return baseGame;
}
