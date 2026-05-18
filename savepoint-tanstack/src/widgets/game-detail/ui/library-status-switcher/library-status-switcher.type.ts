import type {
  LibraryItem,
  LibraryItemStatus,
} from "../../../../../shared/lib/prisma/client.ts";

/**
 * Inline 5-pill status switcher displayed on the game-detail hero. Composes
 * two feature server fns:
 *   - `addGameToLibraryFn` when no library entry exists yet
 *   - `updateLibraryItemFn` when the viewer already has an entry
 *
 * FSD note: this lives in `widgets/game-detail/` (not in a feature) because
 * it composes server fns from TWO features (`add-game` + `manage-library-entry`),
 * which a feature itself cannot do. Widgets are the rightful layer for
 * multi-feature composition.
 */
export type LibraryStatusSwitcherProps = {
  igdbId: number;
  gameTitle: string;
  entry: LibraryItem | null;
};

export type StatusPill = {
  value: LibraryItemStatus;
  label: string;
};
