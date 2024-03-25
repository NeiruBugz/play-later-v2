type Platform = {
  id: number;
  name: string;
};

type Company = {
  id: number;
  name: string;
};

type PlatformWithReleaseDate = {
  id: number;
  human: string;
  platform: Platform;
};

type GameCover = {
  id: number;
  image_id: string;
};

type ExternalGame = {
  id: number;
  category: number;
  name: string;
  url: string;
};

type GameEngine = {
  id: number;
  name: string;
};

type GameMode = {
  id: number;
  name: string;
};

type Genre = {
  id: number;
  name: string;
};

type InvolvedCompany = {
  id: number;
  company: Company;
  developer: boolean;
  publisher: boolean;
};

type PlayerPerspective = {
  id: number;
  name: string;
};

type ReleaseDate = {
  id: number;
  human: string;
  platform: PlatformWithReleaseDate[];
};

type Screenshot = {
  id: number;
  image_id: string;
};

type SimilarGame = {
  id: number;
  name: string;
  cover: GameCover;
};

type Theme = {
  id: number;
  name: string;
};

type Website = {
  id: number;
  category: number;
  trusted: boolean;
  url: string;
};

export type RequestOptions = {
  resource: string;
  body?: string;
};

export type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export type RatedGameResponse = {
  id: number;
  cover: GameCover;
  name: string;
};

export type FullGameInfoResponse = {
  id: number;
  name: string;
  aggregated_rating: number;
  cover: GameCover;
  summary: string;
  themes: Theme[];
  external_games: ExternalGame[];
  game_engines: GameEngine[];
  websites: Website[];
  similar_games: SimilarGame[];
  screenshots: Screenshot[];
  release_dates: ReleaseDate[];
  player_perspectives: PlayerPerspective[];
  involved_companies: InvolvedCompany[];
  genres: Genre[];
  game_modes: GameMode[];
};

export type SearchResponse = {
  id: number;
  name: string;
  platforms: Array<Platform>;
  cover: GameCover;
  first_release_date: number;
};
