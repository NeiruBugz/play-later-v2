import { env } from "@/env.mjs";

import {
  FullGameInfoResponse,
  RatedGameResponse,
  RequestOptions,
  SearchResponse,
  TwitchTokenResponse,
} from "@/types/igdb";
import { API_URL, TOKEN_URL } from "@/config/site";

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
  token: null as TwitchTokenResponse | null,

  async getToken(): Promise<void> {
    try {
      const res = await fetch(TOKEN_URL, { method: "POST", cache: "no-store" });
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
  }: RequestOptions): Promise<T | void> {
    try {
      const response = await fetch(`${API_URL}${resource}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Client-ID": env.IGDB_CLIENT_ID,
          Authorization: `Bearer ${this.token?.access_token}`,
        },
        ...options,
      });

      const data = await response.json();
      return data;
    } catch (thrown) {
      const error = asError(thrown);
      console.error(`${error.name}: ${error.message}`);
      if (error.stack) console.error(error.stack);
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getGamesByRating(): Promise<RatedGameResponse[] | void> {
    return this.request({
      resource: "/games",
      body: gamesByRating,
    });
  },

  async getGameById(gameId: number): Promise<FullGameInfoResponse | void> {
    return this.request({
      resource: "/games",
      body: `${fullGameInfo} where id = (${gameId});`,
    });
  },

  async search({
    name = "",
    ...fields
  }: {
    name: string | null;
    [key: string]: string | null;
  }): Promise<SearchResponse[] | void> {
    if (!name) return;
    let str = "";

    for (const [key, value] of Object.entries(fields)) {
      str += ` & ${key} = ${value}`;
    }

    return this.request({
      resource: "/games",
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
    });
  },
};

await igdbApi.getToken();

export default igdbApi;
