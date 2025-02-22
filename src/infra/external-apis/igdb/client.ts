import { IGDBClientInterface } from '@/domain/external-apis/igdb-client';
import { QueryBuilder } from '@/infra/external-apis/igdb/query-builder';
import {
  getTimeStamp,
  asError,
  normalizeTitle,
  normalizeString,
} from '@/infra/external-apis/igdb/utils';
import { API_URL, TOKEN_URL } from '@/shared/config/igdb.config';
import {
  TwitchTokenResponse,
  RatedGameResponse,
  UpcomingEventsResponse,
  FullGameInfoResponse,
  GenresResponse,
  UpcomingReleaseResponse,
  SearchResponse,
  Artwork,
  IgdbGameResponseItem,
  RequestOptions,
  Event,
  PlatformWithReleaseDate,
} from '@/shared/types/igdb.types';
import { env } from '../../../../env.mjs';

export class IGDBClient implements IGDBClientInterface {
  private token: TwitchTokenResponse | null = null;
  private tokenExpiry: number = 0;

  private async fetchToken(): Promise<TwitchTokenResponse | void> {
    try {
      const res = await fetch(TOKEN_URL, { cache: 'no-store', method: 'POST' });
      if (!res.ok) {
        throw new Error(`Failed to fetch token: ${res.statusText}`);
      }
      const token: TwitchTokenResponse = await res.json();
      this.token = token;
      this.tokenExpiry = getTimeStamp() + token.expires_in - 60;
      return token;
    } catch (thrown) {
      this.handleError(thrown);
    }
  }

  private async getToken(): Promise<string | undefined> {
    if (this.token && getTimeStamp() < this.tokenExpiry) {
      return this.token.access_token;
    }
    const token = await this.fetchToken();
    return token?.access_token;
  }

  private async request<T>(options: RequestOptions): Promise<T | undefined> {
    try {
      const accessToken = await this.getToken();

      if (!accessToken) {
        this.handleError(new Error('Unauthorized: No valid token available.'));
        return;
      }

      const response = await fetch(`${API_URL}${options.resource}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'Client-ID': env.IGDB_CLIENT_ID,
        },
        method: 'POST',
        body: options.body,
      });

      if (!response.ok) {
        console.error(response);
        throw new Error(`IGDB API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (thrown) {
      this.handleError(thrown);
    }
  }

  private handleError(thrown: unknown): void {
    const error = asError(thrown);
    console.error(`${error.name}: ${error.message}`);
    if (error.stack) console.error(error.stack);
  }

  // -------------------------------
  // Implement the methods from IGDBClientInterface
  // -------------------------------
  async getEventLogo(
    id: Event['event_logo'],
  ): Promise<
    | Array<{ height: number; id: number; image_id: string; width: number }>
    | undefined
  > {
    const query = new QueryBuilder()
      .fields(['width', 'height', 'image_id'])
      .where(`id = (${id})`)
      .build();

    return this.request({
      body: query,
      resource: '/event_logos',
    });
  }

  async getGamesByRating(): Promise<RatedGameResponse[] | undefined> {
    const query = new QueryBuilder()
      .fields(['name', 'cover.image_id'])
      .sort('aggregated_rating', 'desc')
      .where(
        'aggregated_rating_count > 20 & aggregated_rating != null & rating != null & category = 0',
      )
      .limit(12)
      .build();

    return this.request<RatedGameResponse[]>({
      body: query,
      resource: '/games',
    });
  }

  async getEvents(): Promise<UpcomingEventsResponse | undefined> {
    const query = new QueryBuilder()
      .fields([
        'checksum',
        'created_at',
        'description',
        'end_time',
        'event_logo',
        'event_networks',
        'games',
        'live_stream_url',
        'name',
        'slug',
        'start_time',
        'time_zone',
        'updated_at',
        'videos',
      ])
      .sort('start_time', 'asc')
      .where(`start_time >= ${getTimeStamp()}`)
      .limit(10)
      .build();

    return this.request<UpcomingEventsResponse>({
      body: query,
      resource: '/events',
    });
  }

  async getGameById(
    gameId: number | null,
  ): Promise<FullGameInfoResponse | undefined> {
    if (!gameId) return;
    const query = new QueryBuilder()
      .fields([
        'name',
        'summary',
        'aggregated_rating',
        'cover.image_id',
        'genres.name',
        'screenshots.image_id',
        'release_dates.platform.name',
        'release_dates.human',
        'involved_companies.developer',
        'involved_companies.publisher',
        'involved_companies.company.name',
        'game_modes.name',
        'game_engines.name',
        'player_perspectives.name',
        'themes.name',
        'external_games.category',
        'external_games.name',
        'external_games.url',
        'similar_games.name',
        'similar_games.cover.image_id',
        'websites.url',
        'websites.category',
        'websites.trusted',
      ])
      .where(`id = (${gameId})`)
      .build();

    const response = await this.request<FullGameInfoResponse[]>({
      body: query,
      resource: '/games',
    });

    return response && response.length ? response[0] : undefined;
  }

  async getGameScreenshots(
    gameId: number | null | undefined,
  ): Promise<{ id: number; screenshots: FullGameInfoResponse['screenshots'] }> {
    if (!gameId) return { id: 0, screenshots: [] };

    const query = new QueryBuilder()
      .fields(['screenshots.image_id'])
      .where(`id = (${gameId})`)
      .build();

    const response = await this.request<
      Array<{ id: number; screenshots: FullGameInfoResponse['screenshots'] }>
    >({
      body: query,
      resource: '/games',
    });

    return response && response[0] ? response[0] : { id: 0, screenshots: [] };
  }

  async getGameRating(
    gameId: number | null | undefined,
  ): Promise<{ id: number | null; aggregated_rating: number | null }> {
    if (!gameId) return { id: null, aggregated_rating: null };

    const query = new QueryBuilder()
      .fields(['aggregated_rating'])
      .where(`id = (${gameId})`)
      .build();

    const response = await this.request<
      Array<{ id: number; aggregated_rating: number }>
    >({
      body: query,
      resource: '/games',
    });

    return response && response[0]
      ? response[0]
      : { id: null, aggregated_rating: null };
  }

  async getSimilarGames(gameId: number | null | undefined): Promise<{
    id: number | null;
    similar_games: FullGameInfoResponse['similar_games'];
  }> {
    if (!gameId) return { id: null, similar_games: [] };

    const query = new QueryBuilder()
      .fields([
        'genres.name',
        'similar_games.name',
        'similar_games.cover.image_id',
      ])
      .where(`id = (${gameId})`)
      .build();

    const response = await this.request<
      Array<{
        id: number;
        similar_games: FullGameInfoResponse['similar_games'];
      }>
    >({
      body: query,
      resource: '/games',
    });

    return response && response[0]
      ? response[0]
      : { id: null, similar_games: [] };
  }

  async getGameGenres(
    gameId: number | null | undefined,
  ): Promise<Array<GenresResponse> | Array<{ id: null; genres: [] }>> {
    if (!gameId) return [];

    const query = new QueryBuilder()
      .fields(['genres.name'])
      .where(`id = (${gameId})`)
      .build();

    const response = await this.request<
      Array<GenresResponse> | Array<{ id: null; genres: [] }>
    >({
      body: query,
      resource: '/games',
    });

    return response || [];
  }

  async getNextMonthReleases(
    ids: number[],
  ): Promise<UpcomingReleaseResponse[] | []> {
    if (!ids.length) return [];

    const query = new QueryBuilder()
      .fields([
        'name',
        'cover.image_id',
        'first_release_date',
        'release_dates.platform.name',
        'release_dates.human',
      ])
      .sort('first_release_date', 'asc')
      .where(`id = (${ids.join(',')})`)
      .build();

    const result = await this.request<UpcomingReleaseResponse[] | []>({
      body: query,
      resource: '/games',
    });

    if (!result) {
      return [];
    }

    return result;
  }

  async getPlatforms(): Promise<Omit<PlatformWithReleaseDate, 'human'>[]> {
    const query = new QueryBuilder().fields(['name']).build();
    const result = await this.request<
      Omit<PlatformWithReleaseDate, 'human'>[] | []
    >({
      body: query,
      resource: '/platforms',
    });

    if (!result) {
      return [];
    }
    return result;
  }

  async search({
    name = '',
    fields,
  }: {
    name: null | string;
    fields?: Record<string, string>;
  }): Promise<SearchResponse[] | undefined> {
    if (!name) return;

    let filters = '';
    if (fields && Object.values(fields).length !== 0) {
      const filterConditions = Object.entries(fields)
        .map(([key, value]) => {
          if (!value) return;
          const fieldName = key === 'platform' ? 'platforms' : key;
          return Array.isArray(value)
            ? `${fieldName}=(${value.join(',')})`
            : `${fieldName} = (${value})`;
        })
        .filter(Boolean)
        .join(' & ');
      if (filterConditions) filters = ` & ${filterConditions}`;
    }

    const query = new QueryBuilder()
      .fields([
        'name',
        'summary',
        'platforms.name',
        'release_dates.human',
        'first_release_date',
        'category',
        'cover.image_id',
      ])
      .where(`cover.image_id != null ${filters}`)
      .search(normalizeTitle(normalizeString(name)))
      .limit(100)
      .build();

    return this.request<SearchResponse[]>({
      body: query,
      resource: '/games',
    });
  }

  async getArtworks(gameId: number): Promise<Artwork[] | undefined> {
    const query = new QueryBuilder()
      .fields([
        'alpha_channel',
        'animated',
        'checksum',
        'game',
        'height',
        'image_id',
        'url',
        'width',
      ])
      .where(`game = ${gameId}`)
      .build();

    return this.request<Artwork[] | undefined>({
      body: query,
      resource: '/artworks',
    });
  }

  async getPlatformId(
    platformName: string,
  ): Promise<{ platformId: Array<{ id: number; name: string }> } | undefined> {
    const query = new QueryBuilder()
      .fields(['id', 'name'])
      .search(platformName)
      .limit(1)
      .build();

    return this.request({
      body: query,
      resource: '/platforms',
    });
  }

  async getGameByName(
    gameName: string,
  ): Promise<IgdbGameResponseItem[] | undefined> {
    const query = new QueryBuilder()
      .fields(['name', 'cover.url', 'cover.image_id', 'version_title'])
      .search(gameName)
      .build();

    return this.request<IgdbGameResponseItem[]>({
      body: query,
      resource: '/games',
    });
  }
}
