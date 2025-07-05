import { BacklogItem, Game, Review } from "@prisma/client";

import { testDataBase } from "../database";

export interface GameFactoryOptions {
  title?: string;
  igdbId?: number;
  description?: string;
  coverImage?: string;
  steamAppId?: number;
}

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

  return await testDataBase.game.create({
    data: defaultData,
  });
};

export interface BacklogItemFactoryOptions {
  userId: string;
  gameId: string;
  status?: "TO_PLAY" | "PLAYING" | "COMPLETED" | "WISHLIST";
  platform?: string;
  acquisitionType?: "DIGITAL" | "PHYSICAL" | "SUBSCRIPTION";
}

export const createBacklogItem = async (
  options: BacklogItemFactoryOptions
): Promise<BacklogItem> => {
  const defaultData = {
    status: "TO_PLAY" as const,
    platform: "PC",
    acquisitionType: "DIGITAL" as const,
    ...options,
  };

  return await testDataBase.backlogItem.create({
    data: defaultData,
  });
};

export interface ReviewFactoryOptions {
  userId: string;
  gameId: string;
  rating?: number;
  content?: string;
  completedOn?: string;
}

export const createReview = async (
  options: ReviewFactoryOptions
): Promise<Review> => {
  const defaultData = {
    rating: 8,
    content: "This is a test review",
    completedOn: "PC",
    ...options,
  };

  return await testDataBase.review.create({
    data: defaultData,
  });
};
