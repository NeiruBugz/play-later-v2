/**
 * IGDB game category enumeration
 * @see https://api-docs.igdb.com/#game
 */
export enum GameCategory {
  MAIN_GAME = 0,
  DLC_ADDON = 1,
  EXPANSION = 2,
  BUNDLE = 3,
  STANDALONE_EXPANSION = 4,
  MOD = 5,
  EPISODE = 6,
  SEASON = 7,
  REMAKE = 8,
  REMASTER = 9,
  EXPANDED_GAME = 10,
  PORT = 11,
  FORK = 12,
  PACK = 13,
  UPDATE = 14,
}

export const ALLOWED_GAME_CATEGORIES = [
  GameCategory.MAIN_GAME,
  GameCategory.DLC_ADDON,
  GameCategory.EXPANSION,
  GameCategory.STANDALONE_EXPANSION,
  GameCategory.REMAKE,
  GameCategory.REMASTER,
  GameCategory.EXPANDED_GAME,
  GameCategory.PORT,
] as const;

export const ALLOWED_FRANCHISE_GAME_CATEGORIES = [
  GameCategory.MAIN_GAME,
  GameCategory.REMAKE,
  GameCategory.REMASTER,
  GameCategory.EXPANDED_GAME,
] as const;
