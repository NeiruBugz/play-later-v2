/**
 * Props for a single Games-group row inside the command palette.
 *
 * Cover image, title, and release year. Mirrors canonical's
 * `savepoint-app/features/command-palette/ui/game-result-item.tsx`, including
 * the "Add to Up Next" quick-add affordance (canonical `showAddHint` +
 * `useQuickAddFromPalette`).
 */
export type GameResultItemProps = {
  /** IGDB game id — used by the "Add to Up Next" quick-add mutation. */
  igdbId: number;
  /** IGDB image id (e.g. `co1abc`). `null` renders the placeholder. */
  coverImageId: string | null;
  /** Game title shown in the row body. */
  name: string;
  /** URL-safe slug used to build the `/games/$slug` href. */
  slug: string;
  /** Optional 4-digit release year. */
  releaseYear: number | null;
  /** Called after the user activates the row, so the palette can close. */
  onAfterSelect: () => void;
};
