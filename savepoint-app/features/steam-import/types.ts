// Steam profile info returned from Steam API
export type SteamProfile = {
  steamId64: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
};

// Steam owned game from Steam API
export type SteamOwnedGame = {
  appId: number;
  name: string;
  playtimeForever: number; // Total playtime in minutes
  playtimeWindows: number; // Windows playtime in minutes
  playtimeMac: number; // Mac playtime in minutes
  playtimeLinux: number; // Linux playtime in minutes
  lastPlayedAt: Date | null; // Unix timestamp converted to Date, or null if never played
  imgIconUrl: string | null;
  imgLogoUrl: string | null;
};

// Import result from POST /api/steam/games
export type SteamImportResult = {
  imported: number; // Games added/updated in ImportedGame
  total: number; // Total owned games from Steam
  filtered: number; // DLC/demos/soundtracks skipped
};

// Connection status for UI
export type SteamConnectionStatus =
  | { connected: false }
  | { connected: true; profile: SteamProfile };

// Filter options for imported games list
export type PlaytimeStatus = "all" | "played" | "never_played";
export type PlaytimeRange =
  | "all"
  | "under_1h"
  | "1_to_10h"
  | "10_to_50h"
  | "over_50h";
export type PlatformFilter = "all" | "windows" | "mac" | "linux";
export type LastPlayedFilter =
  | "all"
  | "30_days"
  | "1_year"
  | "over_1_year"
  | "never";
export type SortOption =
  | "name_asc"
  | "name_desc"
  | "playtime_desc"
  | "playtime_asc"
  | "last_played_desc"
  | "last_played_asc"
  | "added_desc";

// Query options for imported games list
export type ImportedGamesQueryOptions = {
  search?: string;
  page?: number;
  limit?: number;
  playtimeStatus?: PlaytimeStatus;
  playtimeRange?: PlaytimeRange;
  platform?: PlatformFilter;
  lastPlayed?: LastPlayedFilter;
  sortBy?: SortOption;
};
