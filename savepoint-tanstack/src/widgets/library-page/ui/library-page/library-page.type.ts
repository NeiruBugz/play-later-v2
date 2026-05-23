import type {
  GetLibraryResult,
  LibraryItemWithGame,
} from "@/entities/library-item/model";
import type {
  LibraryFiltersProps,
  LibrarySortBy,
  LibrarySortOrder,
  LibraryStatus,
} from "@/features/filter-library";

export type LibraryPageOnboardingSignals = {
  libraryItemCount: number;
  journalEntryCount: number;
  userImage: string | null;
  userSteamId: string | null;
};

export type LibraryPageProps = {
  items: LibraryItemWithGame[];
  total: GetLibraryResult["total"];
  status: LibraryStatus | undefined;
  platform: string | undefined;
  minRating: number | undefined;
  unratedOnly?: boolean | undefined;
  sortBy: LibrarySortBy;
  sortOrder: LibrarySortOrder;
  /**
   * Distinct platform names derived from the user's own library. When omitted
   * the filters fall back to the built-in `DEFAULT_PLATFORMS` constant
   * (preserves existing tests that don't supply this prop).
   */
  platforms?: ReadonlyArray<string>;
  /**
   * Optional onboarding signals for the first-time `/library` hero. When
   * present AND `total === 0`, the page renders `<EmptyLibraryHero/>`
   * (which embeds the OnboardingChecklist) in place of the generic
   * EmptyState. Existing tests omit this prop, which falls back to the
   * generic EmptyState — preserves Slice 18 behaviour.
   */
  onboarding?: LibraryPageOnboardingSignals;
};

export type LibraryFiltersDerivedProps = LibraryFiltersProps;
