import type {
  Artwork,
  Event,
  FullGameInfoResponse,
  GenresResponse,
  IgdbGameResponseItem,
  PlatformWithReleaseDate,
  RatedGameResponse,
  SearchResponse,
  UpcomingEventsResponse,
  UpcomingReleaseResponse,
} from '@/shared/types/igdb.types';

export interface IGDBClientInterface {
  getEventLogo(
    id: Event['event_logo'],
  ): Promise<
    | Array<{ height: number; id: number; image_id: string; width: number }>
    | undefined
  >;
  getGamesByRating(): Promise<RatedGameResponse[] | undefined>;
  getEvents(): Promise<UpcomingEventsResponse | undefined>;
  getGameById(gameId: number | null): Promise<FullGameInfoResponse | undefined>;
  getGameScreenshots(
    gameId: number | null | undefined,
  ): Promise<{ id: number; screenshots: FullGameInfoResponse['screenshots'] }>;
  getGameRating(
    gameId: number | null | undefined,
  ): Promise<{ id: number | null; aggregated_rating: number | null }>;
  getSimilarGames(gameId: number | null | undefined): Promise<{
    id: number | null;
    similar_games: FullGameInfoResponse['similar_games'];
  }>;
  getGameGenres(
    gameId: number | null | undefined,
  ): Promise<Array<GenresResponse> | Array<{ id: null; genres: [] }>>;
  getNextMonthReleases(ids: number[]): Promise<UpcomingReleaseResponse[] | []>;
  getPlatforms(): Promise<Omit<PlatformWithReleaseDate, 'human'>[]>;
  search(params: {
    name: null | string;
    fields?: Record<string, string>;
  }): Promise<SearchResponse[] | undefined>;
  getArtworks(gameId: number): Promise<Artwork[] | undefined>;
  getPlatformId(
    platformName: string,
  ): Promise<{ platformId: Array<{ id: number; name: string }> } | undefined>;
  getGameByName(gameName: string): Promise<IgdbGameResponseItem[] | undefined>;
  /**
   * Fetch game data for Steam import
   * @param gameName The normalized game name from Steam
   */
  getGameForSteamImport(gameName: string): Promise<{
    id: number;
    name: string;
    summary?: string;
    cover?: { image_id: string };
    first_release_date?: number;
    genres?: Array<{ id: number; name: string }>;
    alternative_names?: Array<{ name: string }>;
    aggregated_rating?: number;
    screenshots?: Array<{ image_id: string }>;
    involved_companies?: Array<{
      developer: boolean;
      publisher: boolean;
      company: { name: string };
    }>;
    game_modes?: Array<{ name: string }>;
    game_engines?: Array<{ name: string }>;
    player_perspectives?: Array<{ name: string }>;
    themes?: Array<{ name: string }>;
    external_games?: Array<{
      category: number;
      name: string;
      url: string;
    }>;
    websites?: Array<{
      url: string;
      category: number;
      trusted: boolean;
    }>;
  } | null>;
}
