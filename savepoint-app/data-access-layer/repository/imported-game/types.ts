import type { IgdbMatchStatus, ImportedGame, Storefront } from "@prisma/client";

export type CreateImportedGameInput = {
  name: string;
  storefront: Storefront;
  storefrontGameId?: string | null;
  playtime?: number | null;
  playtimeWindows?: number | null;
  playtimeMac?: number | null;
  playtimeLinux?: number | null;
  lastPlayedAt?: Date | null;
  img_icon_url?: string | null;
  img_logo_url?: string | null;
  igdbMatchStatus?: IgdbMatchStatus;
};

export type PlaytimeStatus = "all" | "played" | "never_played";
export type PlaytimeRange =
  | "all"
  | "under_1h"
  | "1_to_10h"
  | "10_to_50h"
  | "over_50h";
export type Platform = "all" | "windows" | "mac" | "linux";
export type LastPlayed = "all" | "30_days" | "1_year" | "over_1_year" | "never";
export type SortBy =
  | "name_asc"
  | "name_desc"
  | "playtime_desc"
  | "playtime_asc"
  | "last_played_desc"
  | "last_played_asc"
  | "added_desc";

export type ImportedGameQueryOptions = {
  search?: string;
  page?: number;
  limit?: number;
  playtimeStatus?: PlaytimeStatus;
  playtimeRange?: PlaytimeRange;
  platform?: Platform;
  lastPlayed?: LastPlayed;
  sortBy?: SortBy;
};

export type RepositoryWarning = {
  code: string;
  message: string;
  context?: Record<string, unknown>;
};

export type PaginatedImportedGames = {
  items: ImportedGame[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  warnings?: RepositoryWarning[];
};
