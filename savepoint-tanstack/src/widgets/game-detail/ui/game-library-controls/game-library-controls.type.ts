import type { UseSetStatusResult } from "@/features/manage-library-entry";

import type { LibraryItem } from "../../../../../shared/lib/prisma/client.ts";

export type LibraryStatusState = Pick<
  UseSetStatusResult,
  "status" | "setStatus" | "isPending"
>;

export type GameLibraryControlsProps = {
  igdbId: number;
  gameTitle: string;
  entry: LibraryItem | null;
  /** Shared status state of the game page; null while the game is not in the library. */
  libraryStatus: LibraryStatusState | null;
};
