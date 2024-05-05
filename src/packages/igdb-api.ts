import { env } from "@/env.mjs";
import { API_URL, TOKEN_URL } from "@/src/packages/config/site";
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
} from "@/src/packages/types/igdb";

const asError = (thrown: unknown): Error => {
  if (thrown instanceof Error) return thrown;
  try {
    return new Error(JSON.stringify(thrown));
  } catch {
    return new Error(String(thrown));
  }
};
const getTimeStamp = () => {
  return Math.floor(Date.now() / 1000);
};

const gamesByRating = `
  fields
    name,
    cover.image_id;
  sort aggregated_rating desc;
  where aggregated_rating_count > 20 & aggregated_rating != null & rating != null & category = 0;
  limit 12;
`;

const gamingEvents = `
  fields checksum,created_at,description,end_time,event_logo,event_networks,games,live_stream_url,name,slug,start_time,time_zone,updated_at,videos;
  sort start_time asc;
  where start_time >= ${getTimeStamp()};
  limit 10;
`;

const fullGameInfo = `
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
    websites.trusted
;`;

/**
 * 
 * {
  id: 363,
  name: 'Ubisoft Forward',
  slug: 'ubisoft-forward',
  event_logo: 550,
  start_time: 1718042400,
  time_zone: 'PST',
  event_networks: [ 160985, 160986 ],
  created_at: 1712258883,
  updated_at: 1713875085,
  checksum: '17c063a2-b5ea-97cc-5837-4ff8d74cb2ee'
}
 */

const igdbApi = {
  async getEventLogo(
    id: Event["event_logo"]
  ): Promise<
    | { height: number; id: number; image_id: string; width: number }[]
    | undefined
  > {
    return this.request({
      body: `fields width,height,image_id; where id = (${id});`,
      resource: "/event_logos",
    });
  },

  async getEvents(): Promise<UpcomingEventsResponse | undefined> {
    return this.request({
      body: gamingEvents,
      resource: "/events",
    });
  },

  async getGameById(
    gameId: null | number
  ): Promise<FullGameInfoResponse[] | undefined> {
    if (!gameId) return;
    return this.request({
      body: `${fullGameInfo} where id = (${gameId});`,
      resource: "/games",
    });
  },

  async getGameGenres(
    gameId: null | number
  ): Promise<Array<GenresResponse> | undefined> {
    if (!gameId) return;

    return this.request({
      body: `fields genres.name; where id = (${gameId});`,
      resource: "/games",
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getGamesByRating(): Promise<RatedGameResponse[] | undefined> {
    return this.request({
      body: gamesByRating,
      resource: "/games",
    });
  },

  async getNextMonthReleases(
    ids: number[]
  ): Promise<UpcomingReleaseResponse[] | undefined> {
    return this.request({
      body: `fields
  name,
  cover.image_id,
  first_release_date,
  release_dates.human;
  sort first_release_date asc;
  where id = (${ids.join(",")}) & first_release_date > ${getTimeStamp()};`,
      resource: "/games",
    });
  },

  async getToken(): Promise<void> {
    try {
      const res = await fetch(TOKEN_URL, { cache: "no-store", method: "POST" });
      this.token = await res.json();
    } catch (thrown) {
      const error = asError(thrown);
      console.error(`${error.name}: ${error.message}`);
      if (error.stack) console.error(error.stack);
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
      const error = asError(thrown);
      console.error(`${error.name}: ${error.message}`);
      if (error.stack) console.error(error.stack);
    }
  },

  async search({
    name = "",
    ...fields
  }: {
    name: null | string;
  }): Promise<SearchResponse[] | undefined> {
    if (!name) return;
    let str = "";

    for (const [key, value] of Object.entries(fields)) {
      str += ` & ${key} = ${value}`;
    }

    return this.request({
      body: `
      fields
        name,
        platforms.name,
        release_dates.human,
        first_release_date,
        cover.image_id;
      where
        cover.image_id != null
        ${str};
      ${name ? `search "${name}";` : ""}
      limit 100;`,
      resource: "/games",
    });
  },

  token: null as TwitchTokenResponse | null,
};

await igdbApi.getToken();

export default igdbApi;
