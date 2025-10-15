import { type Game, type LibraryItem, type Review } from "@prisma/client";

import { testDataBase } from "../database";

export type GameFactoryOptions = {
  title?: string;
  igdbId?: number;
  description?: string;
  coverImage?: string;
  steamAppId?: number;
};

export const createGame = async (
  options: GameFactoryOptions = {}
): Promise<Game> => {
  const timestamp = Date.now();
  const randomId = Math.floor(Math.random() * 1000000);

  const defaultData = {
    title: `Test Game ${timestamp}`,
    igdbId: randomId,
    description: "A test game for testing purposes",
    steamAppId: randomId,
    ...options,
  };

  return testDataBase.game.create({
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

  return testDataBase.libraryItem.create({
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

  return testDataBase.review.create({
    data: defaultData,
  });
};
