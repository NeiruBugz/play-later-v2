import {
  type Company,
  type Cover,
  type Event,
  type ExternalGame,
  type Franchise,
  type GameEngine,
  type GameMode,
  type Genre,
  type Platform,
  type PlayerPerspective,
  type Screenshot,
  type Theme,
  type Website,
} from "igdb-api-types";

// Core IGDB entity types now imported from igdb-api-types:
// Platform, Company, Cover (GameCover), ExternalGame, GameEngine, GameMode, Genre,
// PlayerPerspective, Screenshot, Theme, Website, Event, Artwork

type PlatformWithReleaseDate = {
  human: string;
  id: number;
  name: string;
};

type InvolvedCompany = {
  company: Company;
  developer: boolean;
  id: number;
  publisher: boolean;
};

type ReleaseDate = {
  human: string;
  id: number;
  platform: PlatformWithReleaseDate;
};

type SimilarGame = {
  cover: Cover;
  id: number;
  name: string;
  release_dates: ReleaseDate[];
  first_release_date: number;
};

export type RequestOptions = {
  body?: string;
  resource: string;
};

export type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export type RatedGameResponse = {
  cover: Cover;
  id: number;
  name: string;
};

export type GenresResponse = {
  genres: Genre[];
  id: number;
};

export type FullGameInfoResponse = {
  aggregated_rating: number;
  cover: Cover;
  external_games: ExternalGame[];
  game_engines: GameEngine[];
  game_modes: GameMode[];
  genres: Genre[];
  id: number;
  involved_companies: InvolvedCompany[];
  name: string;
  player_perspectives: PlayerPerspective[];
  release_dates: ReleaseDate[];
  screenshots: Screenshot[];
  similar_games: SimilarGame[];
  summary: string;
  themes: Theme[];
  websites: Website[];
  franchise?: Franchise;
  franchises: number[];
};

export type SearchResponse = {
  cover: Cover;
  first_release_date: number;
  id: number;
  name: string;
  platforms: Platform[];
  release_dates?: ReleaseDate[];
};

export type UpcomingReleaseResponse = {
  cover: Cover;
  first_release_date: number;
  id: number;
  name: string;
  release_dates: ReleaseDate[];
};

// Event and Artwork now imported from igdb-api-types

export type UpcomingEventsResponse = Event[];

export type IgdbGameResponseItem = {
  name: string;
  version_title: string;
  id: number;
  cover: Cover;
};

export type TimeToBeatsResponse = {
  id: number;
  hastily: number;
  normally: number;
  completely: number;
  count: number;
};

export type Expansion = {
  id: number;
  name: string;
  cover: Cover;
  release_dates: ReleaseDate[];
};

export type DLCAndExpansionListResponse = {
  id: number;
  expansions: Expansion[];
};

export type FranchiseGamesResponse = {
  id: number;
  name: string;
  games: Array<{
    id: number;
    name: string;
    cover: Cover;
    game_type: number;
  }>;
};

export enum GAME_TYPE {
  MAIN_GAME = 0,

  EXPANDED_GAME = 10,
}
