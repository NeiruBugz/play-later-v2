import { type Game, type LibraryItem, type Review } from "@prisma/client";

import { getTestDatabase } from "../database";

// Counter to ensure unique slugs even when created concurrently
let gameCounter = 0;

export type GameFactoryOptions = {
  title?: string;
  slug?: string;
  igdbId?: number;
  description?: string;
  coverImage?: string;
  steamAppId?: number;
};

export const createGame = async (
  options: GameFactoryOptions = {}
): Promise<Game> => {
  // Increment counter first to get unique value
  const uniqueId = ++gameCounter;
  const timestamp = Date.now();
  const randomId = Math.floor(Math.random() * 1000000);

  const defaultData = {
    title: `Test Game ${timestamp}`,
    slug: options.slug || `test-game-${timestamp}-${uniqueId}`,
    igdbId: options.igdbId ?? randomId,
    description: "A test game for testing purposes",
    steamAppId: randomId,
    ...options,
  };

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
};

export const createLibraryItem = async (
  options: LibraryItemFactoryOptions
): Promise<LibraryItem> => {
  const defaultData = {
    status: "CURIOUS_ABOUT" as const,
    platform: "PC",
    acquisitionType: "DIGITAL" as const,
    ...options,
  };

  return getTestDatabase().libraryItem.create({
    data: defaultData,
  });
};

export type ReviewFactoryOptions = {
  userId: string;
  gameId: string;
  rating?: number;
  content?: string;
  completedOn?: string;
};

export const createReview = async (
  options: ReviewFactoryOptions
): Promise<Review> => {
  const defaultData = {
    rating: 8,
    content: "This is a test review",
    completedOn: "PC",
    ...options,
  };

  return getTestDatabase().review.create({
    data: defaultData,
  });
};
