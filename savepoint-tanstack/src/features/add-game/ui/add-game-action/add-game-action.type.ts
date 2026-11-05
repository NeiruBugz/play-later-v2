import type { AddableGame } from "../../model/add-game.type";

export type AddGameActionProps = {
  game: AddableGame;
  /** "icon" is the compact "+" for result rows; "labelled" is the game page's "Add to library" button. */
  variant?: "icon" | "labelled";
};
