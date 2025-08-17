import { type BacklogItem, type Game } from "@prisma/client";

export type GameWithBacklogItems = {
  game: Game;
  backlogItems: Array<Omit<BacklogItem, "game">>;
};

export type BacklogItemWithGame = BacklogItem & {
  game: Game;
};
