// PUBLIC barrel — client-reachable. Server-only `.server.ts` VALUE exports
// (getLibrary, getLibraryStats, addGameToLibrary, updateLibraryItem,
// deleteLibraryItem, getUniqueLibraryPlatforms) are deep-imported by their server
// consumers, never re-exported here (bundler import-protection denies `.server.*`
// in the client build). See FOOT-GUNS.md #2 + the barrel-hygiene rule. Type-only
// re-exports below are erased at build time and are safe for client modules.
export type {
  GetLibraryFilters,
  GetLibraryResult,
  LibraryItemWithGame,
} from "./get-library.server";
export type { LibraryStats, RecentGame } from "./get-library-stats.server";
export type { AddGameToLibraryInput } from "./add-game-to-library.server";
export type { UpdateLibraryItemInput } from "./update-library-item.server";
