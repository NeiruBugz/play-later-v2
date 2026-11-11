import type {
  DoneOutcome,
  LibraryItem,
} from "../../../../../shared/lib/prisma/client.ts";
import type { LibraryStatusState } from "../game-library-controls/game-library-controls.type";

export type GameHeaderActionsProps = {
  igdbId: number;
  gameTitle: string;
  gameSlug: string;
  entry: LibraryItem | null;
  libraryStatus: LibraryStatusState | null;
  doneOutcome: DoneOutcome | null;
  viewerUserId: string | null;
};
