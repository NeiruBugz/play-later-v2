import { env } from "@/env.mjs";
import { API_URL, TOKEN_URL } from "@/src/shared/config/igdb";
import {
  Event,
  FullGameInfoResponse,
  GenresResponse,
  RatedGameResponse,
  RequestOptions,
  SearchResponse,
  TwitchTokenResponse,
  UpcomingEventsResponse,
  UpcomingReleaseResponse,
} from "@/src/shared/types";

const asError = (thrown: unknown): Error => {
  if (thrown instanceof Error) return thrown;
  try {
    return new Error(JSON.stringify(thrown));
  } catch {
    return new Error(String(thrown));
  }
};

const getTimeStamp = (): number => Math.floor(Date.now() / 1000);

const queries = {
  gamesByRating: `
    fields
      name,
      cover.image_id;
    sort aggregated_rating desc;
    where aggregated_rating_count > 20 & aggregated_rating != null & rating != null & category = 0;
    limit 12;
  `,
  gamingEvents: `
    fields checksum,created_at,description,end_time,event_logo,event_networks,games,live_stream_url,name,slug,start_time,time_zone,updated_at,videos;
    sort start_time asc;
    where start_time >= ${getTimeStamp()};
    limit 10;
  `,
  platforms: `
    fields name;
  `,
  fullGameInfo: `
    fields
      name,
      summary,
      aggregated_rating,
      cover.image_id,
      genres.name,
      screenshots.image_id,
      release_dates.platform.name,
      release_dates.human,
      involved_companies.developer,
      involved_companies.publisher,
      involved_companies.company.name,
      game_modes.name,
      game_engines.name,
      player_perspectives.name,
      themes.name,
      external_games.category,
      external_games.name,
      external_games.url,
      similar_games.name,
      similar_games.cover.image_id,
      websites.url,
      websites.category,
      websites.trusted;
  `,
  eventLogo: (id: number) => `
    fields width,height,image_id;
    where id = (${id});
  `,
  gameRating: (gameId: number) => `
    fields aggregated_rating;
    where id = (${gameId});
  `,
  gameScreenshots: (gameId: number) => `
    fields screenshots.image_id;
    where id = (${gameId});
  `,
  gameGenres: (gameId: number) => `
    fields genres.name;
    where id = (${gameId});
  `,
  nextMonthReleases: (ids: number[]) => `
    fields
      name,
      cover.image_id,
      first_release_date,
      release_dates.platform.name,
      release_dates.human;
    sort first_release_date asc;
    where id = (${ids.join(",")}) & first_release_date >= ${getTimeStamp()};
  `,
  search: (name: string, filters: string) => `
    fields
      name,
      summary,
      platforms.name,
      release_dates.human,
      first_release_date,
      cover.image_id;
    where
      cover.image_id != null
      ${filters};
    ${name ? `search "${name}";` : ""}
    limit 100;
  `,
};

const igdbApi = {
  token: null as TwitchTokenResponse | null,

  async getToken(): Promise<void> {
    try {
      const res = await fetch(TOKEN_URL, { cache: "no-store", method: "POST" });
      this.token = await res.json();
    } catch (thrown) {
      this.handleError(thrown);
    }
  },

  async request<T>({
    resource,
    ...options
  }: RequestOptions): Promise<T | undefined> {
    try {
      const response = await fetch(`${API_URL}${resource}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.token?.access_token}`,
          "Client-ID": env.IGDB_CLIENT_ID,
        },
        method: "POST",
        ...options,
      });

      return await response.json();
    } catch (thrown) {
      this.handleError(thrown);
    }
  },

  handleError(thrown: unknown): void {
    const error = asError(thrown);
    console.error(`${error.name}: ${error.message}`);
    if (error.stack) console.error(error.stack);
  },

  async getEventLogo(
    id: Event["event_logo"]
  ): Promise<
    | { height: number; id: number; image_id: string; width: number }[]
    | undefined
  > {
    return this.request({
      body: queries.eventLogo(id),
      resource: "/event_logos",
    });
  },

  async getGameRating(
    gameId: number
  ): Promise<
    | { id: number; aggregated_rating: number }
    | { id: null; aggregated_rating: null }
  > {
    const response = await this.request<
      Array<{ id: number; aggregated_rating: number }>
    >({
      body: queries.gameRating(gameId),
      resource: "/games",
    });

    return response ? response[0] : { id: null, aggregated_rating: null };
  },

  async getEvents(): Promise<UpcomingEventsResponse | undefined> {
    return this.request({
      body: queries.gamingEvents,
      resource: "/events",
    });
  },

  async getGameScreenshots(
    gameId: number | null | undefined
  ): Promise<{ id: number; screenshots: FullGameInfoResponse["screenshots"] }> {
    if (!gameId) return { id: 0, screenshots: [] };

    const response = await this.request<
      Array<{ id: number; screenshots: FullGameInfoResponse["screenshots"] }>
    >({
      body: queries.gameScreenshots(gameId),
      resource: "/games",
    });

    return response ? response[0] : { id: 0, screenshots: [] };
  },

  async getGameById(
    gameId: number | null
  ): Promise<FullGameInfoResponse[] | undefined> {
    if (!gameId) return;
    return this.request({
      body: `${queries.fullGameInfo} where id = (${gameId});`,
      resource: "/games",
    });
  },

  async getGameGenres(
    gameId: number | null
  ): Promise<Array<GenresResponse> | undefined> {
    if (!gameId) return;
    return this.request({
      body: queries.gameGenres(gameId),
      resource: "/games",
    });
  },

  async getGamesByRating(): Promise<RatedGameResponse[] | undefined> {
    return this.request({
      body: queries.gamesByRating,
      resource: "/games",
    });
  },

  async getNextMonthReleases(
    ids: number[]
  ): Promise<UpcomingReleaseResponse[] | undefined> {
    return this.request({
      body: queries.nextMonthReleases(ids),
      resource: "/games",
    });
  },

  async getPlatforms() {
    return this.request({
      body: queries.platforms,
      resource: "/platforms",
    });
  },

  async search({
    name = "",
    ...fields
  }: {
    name: null | string;
  }): Promise<SearchResponse[] | undefined> {
    if (!name) return;

    const filters = Object.entries(fields)
      .map(([key, value]) => ` & ${key} = ${value}`)
      .join("");

    return this.request({
      body: queries.search(name, filters),
      resource: "/games",
    });
  },
};

await igdbApi.getToken();

export default igdbApi;
