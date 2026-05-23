export type RatingControlsProps = {
  minRating: number | undefined;
  unratedOnly: boolean | undefined;
  onMinRatingChange: (next: number | null) => void;
  onClearMinRating: () => void;
  onUnratedOnlyChange: (checked: boolean) => void;
};
