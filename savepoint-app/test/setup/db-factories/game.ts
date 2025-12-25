import { type Game, type LibraryItem, type Review } from "@prisma/client";

import { getTestDatabase } from "../database";
import { faker, seedFaker } from "../faker";

let gameCounter = 0;
export type GameFactoryOptions = {
  title?: string;
  slug?: string;
  igdbId?: number;
  description?: string;
  coverImage?: string;
  steamAppId?: number;
  releaseDate?: Date | null;
};

export const createGameData = (
  overrides: Partial<GameFactoryOptions> = {}
): Omit<Required<GameFactoryOptions>, "releaseDate"> & {
  releaseDate: Date | null;
} => {
  const uniqueId = ++gameCounter;
  const gameName = overrides.title ?? faker.commerce.productName();

  return {
    title: gameName,
    slug:
      overrides.slug ??
      faker.helpers.slugify(gameName).toLowerCase() + `-${uniqueId}`,
    igdbId: overrides.igdbId ?? faker.number.int({ min: 1, max: 999999 }),
    description: overrides.description ?? faker.lorem.paragraph(),
    coverImage: overrides.coverImage ?? faker.image.url(),
    steamAppId:
      overrides.steamAppId ?? faker.number.int({ min: 1, max: 999999 }),
    releaseDate:
      "releaseDate" in overrides
        ? (overrides.releaseDate ?? null)
        : faker.date.past({ years: 10 }),
  };
};

export const createSeededGameData = (
  seed: number = 12345,
  overrides?: Partial<GameFactoryOptions>
) => {
  seedFaker(seed);
  return createGameData(overrides);
};

export const createGame = async (
  options: GameFactoryOptions = {}
): Promise<Game> => {
  const defaultData = createGameData(options);
  return getTestDatabase().game.create({
    data: defaultData,
  });
};
export type LibraryItemFactoryOptions = {
  userId: string;
  gameId: string;
  status?:
    | "CURIOUS_ABOUT"
    | "CURRENTLY_EXPLORING"
    | "TOOK_A_BREAK"
    | "EXPERIENCED"
    | "WISHLIST"
    | "REVISITING";
  platform?: string;
  acquisitionType?: "DIGITAL" | "PHYSICAL" | "SUBSCRIPTION";
  createdAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
};

export const createLibraryItemData = (
  overrides: Partial<Omit<LibraryItemFactoryOptions, "userId" | "gameId">> = {}
) => {
  return {
    status: overrides.status ?? ("CURIOUS_ABOUT" as const),
    platform: overrides.platform ?? "PC",
    acquisitionType: overrides.acquisitionType ?? ("DIGITAL" as const),
    createdAt: overrides.createdAt,
    startedAt: overrides.startedAt,
    completedAt: overrides.completedAt,
  };
};

export const createSeededLibraryItemData = (
  seed: number = 12345,
  overrides?: Partial<Omit<LibraryItemFactoryOptions, "userId" | "gameId">>
) => {
  seedFaker(seed);
  return createLibraryItemData(overrides);
};

export const createLibraryItem = async (
  options: LibraryItemFactoryOptions
): Promise<LibraryItem> => {
  const { userId, gameId, ...overrides } = options;
  const itemData = createLibraryItemData(overrides);

  if (
    itemData.startedAt &&
    itemData.completedAt &&
    itemData.completedAt < itemData.startedAt
  ) {
    throw new Error(
      `Invalid test data: completedAt (${itemData.completedAt.toISOString()}) must be >= startedAt (${itemData.startedAt.toISOString()}). ` +
        `This violates the database constraint "completedAt_after_startedAt".`
    );
  }

  return getTestDatabase().libraryItem.create({
    data: {
      ...itemData,
      userId,
      gameId,
    },
  });
};
export type ReviewFactoryOptions = {
  userId: string;
  gameId: string;
  rating?: number;
  content?: string;
  completedOn?: string;
};

export const createReviewData = (
  overrides: Partial<Omit<ReviewFactoryOptions, "userId" | "gameId">> = {}
) => {
  return {
    rating: overrides.rating ?? faker.number.int({ min: 1, max: 10 }),
    content: overrides.content ?? faker.lorem.paragraph(),
    completedOn: overrides.completedOn ?? "PC",
  };
};

export const createSeededReviewData = (
  seed: number = 12345,
  overrides?: Partial<Omit<ReviewFactoryOptions, "userId" | "gameId">>
) => {
  seedFaker(seed);
  return createReviewData(overrides);
};

export const createReview = async (
  options: ReviewFactoryOptions
): Promise<Review> => {
  const { userId, gameId, ...overrides } = options;
  const reviewData = createReviewData(overrides);

  return getTestDatabase().review.create({
    data: {
      ...reviewData,
      userId,
      gameId,
    },
  });
};
