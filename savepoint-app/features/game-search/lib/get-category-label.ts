import { GameCategory } from "@/data-access-layer/services/igdb/constants";

export function getCategoryLabel(category: number): string | null {
  switch (category) {
    case GameCategory.MAIN_GAME:
      return "Main Game";
    case GameCategory.DLC_ADDON:
      return "DLC";
    case GameCategory.EXPANSION:
      return "Expansion";
    case GameCategory.STANDALONE_EXPANSION:
      return "Standalone Expansion";
    case GameCategory.REMAKE:
      return "Remake";
    case GameCategory.REMASTER:
      return "Remaster";
    case GameCategory.EXPANDED_GAME:
      return "Expanded Game";
    case GameCategory.PORT:
      return "Port";
    default:
      return null;
  }
}
