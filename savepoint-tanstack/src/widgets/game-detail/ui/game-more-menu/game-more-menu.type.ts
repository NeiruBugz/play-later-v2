import type { LibraryItem } from "../../../../../shared/lib/prisma/client.ts";
import type {
  LibraryOwnershipState,
  LibraryStatusState,
} from "../game-library-controls/game-library-controls.type";

export type GameMoreMenuProps = {
  igdbId: number;
  gameTitle: string;
  entry: LibraryItem | null;
  libraryStatus: LibraryStatusState | null;
  libraryOwnership: LibraryOwnershipState | null;
};
