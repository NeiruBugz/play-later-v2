export * from "./igdb";
export * from "./ui";
export * from "./collection";
export { type SteamAppInfo } from "./steam";

// Re-export core IGDB types from igdb-api-types for convenience
export {
  type Company,
  type Cover,
  type Platform,
  type Game,
  type Genre,
  type ExternalGame,
  type GameEngine,
  type GameMode,
  type PlayerPerspective,
  type Screenshot,
  type Theme,
  type Website,
  type Event,
  type Artwork,
  type Franchise,
} from "igdb-api-types";
