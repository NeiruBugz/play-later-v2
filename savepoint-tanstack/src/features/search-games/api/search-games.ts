/**
 * Re-exports the canonical `searchGamesFn` from `entities/game/api/`.
 *
 * The single source of truth lives at `@/entities/game/api/search-games` so
 * that all feature slices import downward from the entity layer rather than
 * from each other (FSD: no cross-feature sibling imports).
 *
 * This file is kept as a thin re-export so the `search-games` feature's
 * `SearchGamesResults` UI component can continue to reference
 * `../api/search-games` without a path change — all imports still resolve
 * to the one entity-layer server fn.
 */
export {
  searchGamesFn,
  SEARCH_GAMES_INPUT,
} from "@/entities/game/api/search-games";
