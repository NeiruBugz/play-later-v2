import { type BacklogItem, type Game } from "@prisma/client";

export type GameWithBacklogItems = {
  game: Game;
  backlogItems: Array<Omit<BacklogItem, "game">>;
  totalMainStoryHours?: number;
};
