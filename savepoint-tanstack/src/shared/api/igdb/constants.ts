export enum GameCategory {
  MAIN_GAME = 0,
  DLC_ADDON = 1,
  EXPANSION = 2,
  STANDALONE_EXPANSION = 4,
  REMAKE = 8,
  REMASTER = 9,
  EXPANDED_GAME = 10,
  PORT = 11,
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

export const SEARCH_RESULTS_LIMIT = 10;
