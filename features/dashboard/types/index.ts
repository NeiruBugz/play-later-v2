import { type BacklogItem, type Game } from "@prisma/client";

export type GameWithBacklogItems = {
  game: Pick<Game, "id" | "title" | "igdbId" | "coverImage">;
  backlogItems: Array<Omit<BacklogItem, "game">>;
  totalMainStoryHours?: number;
};
