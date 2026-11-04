import type { LibraryStatusState } from "../game-library-controls";

export type GameDetailActionBarProps = {
  gameSlug: string;
  /** Shared status state of the game page; null while the game is not in the library. */
  libraryStatus: LibraryStatusState | null;
  viewerUserId: string | null;
};
