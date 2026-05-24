// Thin re-export so existing `@/features/add-game/api/search-games-fn` consumers
// keep working; the implementation lives at the entity layer.
export {
  searchGamesFn,
  SEARCH_GAMES_INPUT,
} from "@/entities/game/api/search-games";
