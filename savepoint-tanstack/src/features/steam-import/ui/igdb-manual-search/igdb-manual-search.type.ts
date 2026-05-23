export type IgdbManualSearchProps = {
  /**
   * Called when the user clicks "Select" on a result. Parent owns the
   * subsequent action (typically: pass `igdbId` to
   * `importGameToLibraryFn` as `manualIgdbId`).
   */
  onSelect: (igdbId: number) => void;
  /**
   * Disables the input + result Select buttons while a parent mutation
   * is in flight.
   */
  isLoading?: boolean;
};
