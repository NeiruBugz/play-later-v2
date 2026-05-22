/**
 * Re-exports the canonical `searchGamesFn` from `entities/game/api/`.
 *
 * The single source of truth lives at `@/entities/game/api/search-games` so
 * that all feature slices import downward from the entity layer rather than
 * from each other (FSD: no cross-feature sibling imports).
 *
 * This file is kept as a thin re-export so existing consumers that import
 * from `@/features/add-game/api/search-games-fn` continue to work without
 * path changes — the canonical implementation is the entity-layer server fn.
 */
export {
  searchGamesFn,
  SEARCH_GAMES_INPUT,
} from "@/entities/game/api/search-games";
