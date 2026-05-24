// Thin re-export so this feature's UI can reference `../api/search-games`
// without a path change; the implementation lives at the entity layer.
export {
  searchGamesFn,
  SEARCH_GAMES_INPUT,
} from "@/entities/game/api/search-games";
