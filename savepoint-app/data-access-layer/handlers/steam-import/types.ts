import type { SteamProfile } from "@/data-access-layer/services/steam/types";
import type { ImportedGame } from "@prisma/client";

export type ConnectSteamHandlerInput = {
  steamId: string;
  userId: string;
};

export type ConnectSteamHandlerOutput = {
  profile: SteamProfile;
};

export type FetchSteamGamesHandlerInput = {
  userId: string;
};

export type FetchSteamGamesHandlerOutput = {
  imported: number;
  total: number;
  filtered: number;
};

export type ImportedGamesHandlerInput = {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  playtimeStatus?: "all" | "played" | "never_played";
  playtimeRange?: "all" | "under_1h" | "1_to_10h" | "10_to_50h" | "over_50h";
  platform?: "all" | "windows" | "mac" | "linux";
  lastPlayed?: "all" | "30_days" | "1_year" | "over_1_year" | "never";
  sortBy?:
    | "name_asc"
    | "name_desc"
    | "playtime_desc"
    | "playtime_asc"
    | "last_played_desc"
    | "last_played_asc"
    | "added_desc";
};

export type ImportedGamesHandlerOutput = {
  games: ImportedGame[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
