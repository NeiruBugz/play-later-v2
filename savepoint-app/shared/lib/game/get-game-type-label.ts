import { GameCategory } from "@/shared/types";

export function getGameTypeLabel(gameType?: number): string | null {
  if (gameType === undefined || gameType === null) {
    return null;
  }

  switch (gameType) {
    case GameCategory.MAIN_GAME:
      return "Main Game";
    case GameCategory.DLC_ADDON:
      return "DLC";
    case GameCategory.EXPANSION:
      return "Expansion";
    case GameCategory.BUNDLE:
      return "Bundle";
    case GameCategory.STANDALONE_EXPANSION:
      return "Standalone";
    case GameCategory.MOD:
      return "Mod";
    case GameCategory.EPISODE:
      return "Episode";
    case GameCategory.SEASON:
      return "Season";
    case GameCategory.REMAKE:
      return "Remake";
    case GameCategory.REMASTER:
      return "Remaster";
    case GameCategory.EXPANDED_GAME:
      return "Expanded";
    case GameCategory.PORT:
      return "Port";
    case GameCategory.FORK:
      return "Fork";
    case GameCategory.PACK:
      return "Pack";
    case GameCategory.UPDATE:
      return "Update";
    default:
      return null;
  }
}
