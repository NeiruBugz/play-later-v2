import type { Game } from "@prisma/client";
import type { HowLongToBeatEntry } from "howlongtobeat";
import type { ReactNode } from "react";

export type BackloggedWithUser = {
  id: string;
  imageUrl: string;
  title: string;
  user: {
    name?: null | string;
    username?: null | string;
  };
};

export type ReviewItem = {
  author: {
    name: null | string;
    username: null | string;
  };
  content: string;
  createdAt: Date;
  deletedAt: Date | null;
  game: {
    imageUrl: string;
    title: string;
  };
  gameId: string;
  id: number;
  name: null | string;
  userId: string;
};

export type SearchPageProps = {
  searchParams: URLSearchParams;
};

export type MainNavProps = {
  items: NavItem[];
};

export type RenderWhenProps = {
  condition: boolean;
  fallback?: ReactNode;
};
export interface NavItem {
  disabled?: boolean;
  external?: boolean;
  href?: null | string;
  title: string;
}

export type SharedWishlistPageProps = {
  params: {
    id: string;
  };
  searchParams: URLSearchParams;
};

export type SharedWishlistGame = {
  gameplayTime: null | number;
  id: string;
  imageUrl: string;
  title: string;
};

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

export type FetcherAndProcessor = (
  params: URLSearchParams
) => Promise<LibraryData>;

// Combination of own Game model, HowLongToBeat game model and IGDB Game response
export type GameResponseCombined = FullGameInfoResponse &
  Game &
  HowLongToBeatEntry;

export type ResponsePreparer = ({
  gameId,
  isFromWishlist,
}: {
  gameId: Game["id"];
  isFromWishlist?: boolean;
}) => Promise<GameResponseCombined> | void;

export type LibraryData = {
  list: ListEntry[];
};

export type ListEntry = Pick<
  Game,
  | "createdAt"
  | "gameplayTime"
  | "howLongToBeatId"
  | "id"
  | "igdbId"
  | "imageUrl"
  | "status"
  | "title"
  | "updatedAt"
>;

export type LibraryPageProps = {
  searchParams: URLSearchParams;
};

export type LibraryContentProps = {
  backloggedLength: number;
  currentStatus: string;
  list: Game[];
  totalBacklogTime: number;
};

export type LibraryHeaderProps = {
  backlogged: Game[];
  currentStatus: string;
};

export type FilterKeys =
  | "order"
  | "platform"
  | "purchaseType"
  | "search"
  | "sortBy"
  | "status";

export interface RootLayoutProps {
  children: ReactNode;
  modal: ReactNode;
}
