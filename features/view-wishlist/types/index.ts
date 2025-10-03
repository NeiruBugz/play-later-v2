import { type Game, type LibraryItem } from "@prisma/client";

export type GameWithLibraryItems = {
  game: Game;
  libraryItems: Array<Omit<LibraryItem, "game">>;
};

export type LibraryItemWithGame = LibraryItem & {
  game: Game;
};
