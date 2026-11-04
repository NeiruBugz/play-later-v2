export type GameRatingProps = {
  libraryItemId: number;
  /** 1..10 storage int, or null when unrated. */
  rating: number | null;
};
