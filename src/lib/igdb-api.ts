import { env } from "@/env.mjs";
import { API_URL, TOKEN_URL } from "@/src/lib/config/site";
import {
  FullGameInfoResponse,
  GenresResponse,
  RatedGameResponse,
  RequestOptions,
  SearchResponse,
  TwitchTokenResponse,
} from "@/src/lib/types/igdb";

const asError = (thrown: unknown): Error => {
  if (thrown instanceof Error) return thrown;
  try {
    return new Error(JSON.stringify(thrown));
  } catch {
    return new Error(String(thrown));
  }
};

const gamesByRating = `
  fields
    name,
    cover.image_id;
  sort aggregated_rating desc;
  where aggregated_rating_count > 20 & aggregated_rating != null & rating != null & category = 0;
  limit 12;
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

const igdbApi = {
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
