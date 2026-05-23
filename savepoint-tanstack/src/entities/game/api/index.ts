// PUBLIC barrel — client-reachable. Must expose ONLY client-safe / consumer-facing
// surface. `.server.ts` modules are server-only (bundler import-protection denies
// them in the client build); their VALUE exports are deep-imported by their server
// consumers, never re-exported here. See FOOT-GUNS.md #2 + the Slice 21 barrel-hygiene
// rule. Type-only re-exports below are erased at build time and are safe.
export { searchGamesFn, SEARCH_GAMES_INPUT } from "./search-games";

export type { GameDetails } from "./get-game-details.server";
export type { GameCollectionRef } from "./get-game-collections.server";
export type { TimesToBeat } from "./get-times-to-beat.server";
export type {
  GetRelatedGamesParams,
  GetRelatedGamesResult,
  RelatedGame,
} from "./get-related-games.server";
