import type {
  ImportedGamesSortBy,
  ImportedLastPlayedFilter,
  ImportedPlatformFilter,
  ImportedPlaytimeRange,
  ImportedPlaytimeStatus,
} from "@/entities/imported-game/model/types";

export type ImportedGamesFilters = {
  q?: string;
  playtimeStatus?: ImportedPlaytimeStatus;
  playtimeRange?: ImportedPlaytimeRange;
  platform?: ImportedPlatformFilter;
  lastPlayed?: ImportedLastPlayedFilter;
  sortBy?: ImportedGamesSortBy;
};

export type ImportedGamesFilterBarProps = {
  filters: ImportedGamesFilters;
  /** Whether `?include=ignored` is currently active. */
  includeIgnored: boolean;
};
