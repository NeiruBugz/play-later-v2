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
  release_dates: ReleaseDate[];
  first_release_date: number;
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
  franchise: any;
  franchises: number[];
};

export type SearchResponse = {
  cover: GameCover;
  first_release_date: number;
  id: number;
  name: string;
  summary: string;
  platforms: Array<Platform>;
  release_dates?: ReleaseDate[];
};

export type UpcomingReleaseResponse = {
  cover: GameCover;
  first_release_date: number;
  id: number;
  name: string;
  release_dates: ReleaseDate[];
};

export type Event = {
  checksum: string;
  created_at: number;
  description?: string;
  end_time: number;
  event_logo: number;
  event_networks: number[];
  id: number;
  live_stream_url?: string;
  name: string;
  slug: string;
  start_time: number;
  time_zone: string;
  updated_at: number;
};

export type UpcomingEventsResponse = Event[];

export type Artwork = {
  id: number;
  alpha_channel: boolean;
  animated: boolean;
  game: number;
  height: number;
  image_id: string;
  url: string;
  width: number;
  checksum: string;
};

export type IgdbGameResponseItem = {
  name: string;
  version_title: string;
  id: number;
  cover: {
    image_id: string;
    id: number;
    url: string;
  };
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
  cover: {
    image_id: string;
    id: number;
    url: string;
  };
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
    cover: {
      image_id: string;
      id: number;
      url: string;
    };
    game_type: number;
  }>;
};

export enum GAME_TYPE {
  MAIN_GAME = 0,
  EXPANDED_GAME = 10,
}
