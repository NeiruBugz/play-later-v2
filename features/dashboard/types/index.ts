import { type Game, type LibraryItem } from "@prisma/client";

export type GameWithLibraryItems = {
  game: Pick<Game, "id" | "title" | "igdbId" | "coverImage">;
  libraryItems: Array<Omit<LibraryItem, "game">>;
  totalMainStoryHours?: number;
};
