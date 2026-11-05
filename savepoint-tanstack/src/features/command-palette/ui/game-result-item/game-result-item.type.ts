import type { ReactNode } from "react";

import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

export type GameResultItemProps = {
  igdbId: number;
  coverImageId: string | null;
  name: string;
  slug: string;
  releaseYear: number | null;
  /** The viewer's library state for this game; null/absent when not in the library. */
  library?: { status: LibraryItemStatus; upNextPosition: number | null } | null;
  /**
   * Slot for the add control on games outside the library. Injected by the
   * route so this feature never imports the sibling `add-game` feature.
   */
  renderAddAction?: (game: { igdbId: number; name: string }) => ReactNode;
  /** Called when the user opens the game page, so the palette can close. */
  onAfterSelect: () => void;
};
