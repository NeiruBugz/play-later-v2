export { GameCard } from "./ui/game-card";
export { GameCategoryBadge } from "./ui/game-category-badge";
export { GameGridCard } from "./ui/game-grid-card";
export { GameSearchInput } from "./ui/game-search-input";
export { GameSearchResults } from "./ui/game-search-results";
export { QuickAddButton } from "./ui/quick-add-button";
export { ViewToggle } from "./ui/view-toggle";

export { useGameSearch } from "./hooks/use-game-search";
export { useLibraryStatus } from "./hooks/use-library-status";
export { useViewPreference } from "./hooks/use-view-preference";

export { getCategoryLabel } from "./lib/get-category-label";

export { GAME_SEARCH_PAGE_SIZE } from "./constants";

export { SearchGamesSchema } from "./schemas";
export type { SearchGamesInput } from "./schemas";

export type {
  SearchGameResult,
  SearchGameResultWithStatus,
  GameSearchResponse,
} from "./types";
