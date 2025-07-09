import type { BacklogItem, Game } from "@prisma/client";

export type GameWithBacklogItems = {
  game: Pick<Game, "id" | "title" | "igdbId" | "coverImage">;
  backlogItems: Omit<BacklogItem, "game">[];
  totalMainStoryHours?: number;
};
