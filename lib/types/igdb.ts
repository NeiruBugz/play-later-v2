type Platform = {
  id: number;
  name: string;
};

type Company = {
  id: number;
  name: string;
};

type PlatformWithReleaseDate = {
  human: string;
  id: number;
  name: string;
};

type GameCover = {
  id: number;
  image_id: string;
};

type ExternalGame = {
  category: number;
  id: number;
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
  company: Company;
  developer: boolean;
  id: number;
  publisher: boolean;
};

type PlayerPerspective = {
  id: number;
  name: string;
};

type ReleaseDate = {
  human: string;
  id: number;
  platform: PlatformWithReleaseDate;
};

type Screenshot = {
  id: number;
  image_id: string;
};

type SimilarGame = {
  cover: GameCover;
  id: number;
  name: string;
};

type Theme = {
  id: number;
  name: string;
};

type Website = {
  category: number;
  id: number;
  trusted: boolean;
  url: string;
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
  cover: GameCover;
  id: number;
  name: string;
};

export type GenresResponse = {
  genres: Genre[];
  id: number;
};

export type FullGameInfoResponse = {
  aggregated_rating: number;
  cover: GameCover;
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
};

export type SearchResponse = {
  cover: GameCover;
  first_release_date: number;
  id: number;
  name: string;
  platforms: Array<Platform>;
};
