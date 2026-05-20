import type {
  IgdbMatchStatus,
  ImportedGame,
  Storefront,
} from "../../../../shared/lib/prisma/client.ts";

export type { ImportedGame, IgdbMatchStatus, Storefront };

/**
 * Steam-shaped payload accepted by `upsertImportedGamesBatch`. Fields are
 * snake_case-free / domain-friendly; the entity-layer adapter writes them
 * onto the Prisma columns (which keep the legacy `img_icon_url` etc.).
 */
export type SteamImportedGameInput = {
  storefrontGameId: string;
  name: string;
  playtime: number;
  playtimeWindows: number;
  playtimeMac: number;
  playtimeLinux: number;
  lastPlayedAt: Date | null;
  imgIconUrl: string | null;
  imgLogoUrl: string | null;
};

/**
 * Filter / sort / search surface for `findImportedGamesForUser`. Mirrors
 * canonical's `ImportedGameQueryOptions` (Slice 21 Phase D follow-up). All
 * fields are optional; `"all"` is the sentinel for an unset filter on the
 * enum-style values so the route loader can default consistently.
 */
export type ImportedPlaytimeStatus = "all" | "played" | "never_played";
export type ImportedPlaytimeRange =
  | "all"
  | "under_1h"
  | "1_to_10h"
  | "10_to_50h"
  | "over_50h";
export type ImportedPlatformFilter = "all" | "windows" | "mac" | "linux";
export type ImportedLastPlayedFilter =
  | "all"
  | "30_days"
  | "1_year"
  | "over_1_year"
  | "never";
export type ImportedGamesSortBy =
  | "added_desc"
  | "name_asc"
  | "name_desc"
  | "playtime_desc"
  | "playtime_asc"
  | "last_played_desc"
  | "last_played_asc";

export type FindImportedGamesOptions = {
  /** Include rows with `igdbMatchStatus: IGNORED`. Defaults to `false`. */
  includeIgnored?: boolean;
  /**
   * Include rows that have already been added to library
   * (`igdbMatchStatus: MATCHED`). Defaults to `false` — these rows live on
   * the user's library page, so the imported-games surface defaults to
   * "still to import" (PENDING + UNMATCHED).
   */
  includeMatched?: boolean;
  /** 1-based page index. Defaults to `1`. */
  page?: number;
  /** Page size. Defaults to `25`. Hard-capped at `100`. */
  limit?: number;
  /** Case-insensitive substring search against `name`. */
  search?: string;
  playtimeStatus?: ImportedPlaytimeStatus;
  playtimeRange?: ImportedPlaytimeRange;
  platform?: ImportedPlatformFilter;
  lastPlayed?: ImportedLastPlayedFilter;
  sortBy?: ImportedGamesSortBy;
};

export type PaginatedImportedGames = {
  games: ImportedGame[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type UpsertImportedGamesBatchResult = {
  created: number;
  updated: number;
};
