import { useNavigate } from "@tanstack/react-router";

import { getSortValue, SORT_VALUE_MAP } from "./status-config";
import type {
  LibraryAcquisition,
  LibrarySortBy,
  LibrarySortOrder,
  LibraryStatus,
} from "./types";

export type LibraryFiltersStateInput = {
  status: LibraryStatus | undefined;
  platform: string | undefined;
  acquisition: LibraryAcquisition | undefined;
  startedOnly: boolean | undefined;
  minRating: number | undefined;
  unratedOnly: boolean | undefined;
  sortBy: LibrarySortBy;
  sortOrder: LibrarySortOrder;
};

export type LibraryFiltersState = {
  currentStatus: LibraryStatus | "__all__";
  currentAcquisition: LibraryAcquisition | undefined;
  startedOnly: boolean;
  sortValue: string;
  platformValue: string;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  onStatusPick: (value: LibraryStatus) => void;
  onStatusAll: () => void;
  onAcquisitionPick: (value: LibraryAcquisition) => void;
  onStartedOnlyChange: (checked: boolean) => void;
  onPlatformChange: (raw: string) => void;
  onSortChange: (raw: string) => void;
  onMinRatingChange: (next: number | null) => void;
  onClearMinRating: () => void;
  onUnratedOnlyChange: (checked: boolean) => void;
  onClearAll: (extras?: { onAfterClear?: () => void }) => void;
};

/**
 * Centralises all URL-navigation handlers shared by `LibraryFilters` (sidebar)
 * and `MobileFilterBar` (sheet). Both surfaces receive the current filter values
 * as props and delegate every state mutation through this hook.
 */
export function useLibraryFiltersState(
  input: LibraryFiltersStateInput
): LibraryFiltersState {
  const {
    status,
    platform,
    acquisition,
    startedOnly,
    minRating,
    unratedOnly,
    sortBy,
    sortOrder,
  } = input;
  const navigate = useNavigate({ from: "/library" });

  const updateSearch = (
    patch: Partial<{
      status: LibraryStatus | undefined;
      platform: string | undefined;
      acquisition: LibraryAcquisition | undefined;
      startedOnly: boolean | undefined;
      minRating: number | undefined;
      unratedOnly: boolean | undefined;
      sortBy: LibrarySortBy;
      sortOrder: LibrarySortOrder;
    }>
  ) => {
    navigate({
      to: ".",
      search: {
        status,
        platform,
        acquisition,
        startedOnly,
        minRating,
        unratedOnly,
        sortBy,
        sortOrder,
        ...patch,
      },
    });
  };

  const currentStatus: LibraryStatus | "__all__" = status ?? "__all__";
  const sortValue = getSortValue(sortBy, sortOrder);
  const platformValue = platform ?? "__all__";

  const activeFilterCount =
    (status !== undefined ? 1 : 0) +
    (platform !== undefined ? 1 : 0) +
    (acquisition !== undefined ? 1 : 0) +
    (startedOnly === true ? 1 : 0) +
    (minRating !== undefined ? 1 : 0) +
    (unratedOnly === true ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  const onStatusPick = (value: LibraryStatus) => {
    updateSearch({ status: status === value ? undefined : value });
  };

  const onStatusAll = () => updateSearch({ status: undefined });

  const onAcquisitionPick = (value: LibraryAcquisition) => {
    updateSearch({ acquisition: acquisition === value ? undefined : value });
  };

  const onStartedOnlyChange = (checked: boolean) => {
    updateSearch({ startedOnly: checked ? true : undefined });
  };

  const onPlatformChange = (raw: string) => {
    updateSearch({ platform: raw === "__all__" ? undefined : raw });
  };

  const onSortChange = (raw: string) => {
    const opt = SORT_VALUE_MAP.get(raw);
    if (!opt) return;
    updateSearch({ sortBy: opt.sortBy, sortOrder: opt.sortOrder });
  };

  const onMinRatingChange = (next: number | null) => {
    updateSearch({ minRating: next === null ? undefined : next });
  };

  const onClearMinRating = () => updateSearch({ minRating: undefined });

  const onUnratedOnlyChange = (checked: boolean) => {
    updateSearch({ unratedOnly: checked ? true : undefined });
  };

  const onClearAll = (extras?: { onAfterClear?: () => void }) => {
    updateSearch({
      status: undefined,
      platform: undefined,
      acquisition: undefined,
      startedOnly: undefined,
      minRating: undefined,
      unratedOnly: undefined,
      sortBy: "updatedAt",
      sortOrder: "desc",
    });
    extras?.onAfterClear?.();
  };

  return {
    currentStatus,
    currentAcquisition: acquisition,
    startedOnly: startedOnly === true,
    sortValue,
    platformValue,
    hasActiveFilters,
    activeFilterCount,
    onStatusPick,
    onStatusAll,
    onAcquisitionPick,
    onStartedOnlyChange,
    onPlatformChange,
    onSortChange,
    onMinRatingChange,
    onClearMinRating,
    onUnratedOnlyChange,
    onClearAll,
  };
}
