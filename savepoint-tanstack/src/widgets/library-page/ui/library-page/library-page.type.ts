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

export type LibraryPageProps = {
  items: LibraryItemWithGame[];
  total: GetLibraryResult["total"];
  status: LibraryStatus | undefined;
  platform: string | undefined;
  minRating: number | undefined;
  unratedOnly?: boolean | undefined;
  sortBy: LibrarySortBy;
  sortOrder: LibrarySortOrder;
};

export type LibraryFiltersDerivedProps = LibraryFiltersProps;
