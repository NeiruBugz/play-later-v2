import { env } from "@/env.mjs";
import { API_URL, TOKEN_URL } from "@/src/shared/config/igdb";
import {
  Artwork,
  Event,
  FullGameInfoResponse,
  GenresResponse,
  IgdbGameResponseItem,
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

function normalizeString(input: string): string {
  return input
    .toLowerCase()
    .replace(/[:\-]/g, "")
    .replace(/\bthe\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(input: string): string {
  const specialCharsRegex =
    /[\u2122\u00A9\u00AE\u0024\u20AC\u00A3\u00A5\u2022\u2026]/g;
  return input.replace(specialCharsRegex, "").toLowerCase().trim();
}

class QueryBuilder {
  private query: string = "";

  fields(fields: string[]): this {
    this.query += `fields ${fields.join(", ")};\n`;
    return this;
  }

  sort(field: string, order: "asc" | "desc" = "asc"): this {
    this.query += `sort ${field} ${order};\n`;
    return this;
  }

  where(condition: string): this {
    this.query += `where ${condition};\n`;
    return this;
  }

  limit(count: number): this {
    this.query += `limit ${count};\n`;
    return this;
  }

  search(term: string): this {
    this.query += `search "${term}";\n`;
    return this;
  }

  build(): string {
    return this.query.trim();
  }
}

const igdbApi = {
  token: null as TwitchTokenResponse | null,
  tokenExpiry: 0 as number,

  async fetchToken(): Promise<TwitchTokenResponse | void> {
    try {
      const res = await fetch(TOKEN_URL, { cache: "no-store", method: "POST" });
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
  },

  async getToken(): Promise<string | undefined> {
    if (this.token && getTimeStamp() < this.tokenExpiry) {
      return this.token.access_token;
    }
    const token = await this.fetchToken();
    return token?.access_token;
  },

  async request<T>(options: RequestOptions): Promise<T | undefined> {
    try {
      const accessToken = await this.getToken();

      if (!accessToken) {
        this.handleError(new Error("Unauthorized: No valid token available."));
        return;
      }

      const response = await fetch(`${API_URL}${options.resource}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Client-ID": env.IGDB_CLIENT_ID,
        },
        method: "POST",
        body: options.body,
      });

      if (!response.ok) {
        throw new Error(`IGDB API error: ${response.statusText}`);
      }

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
    const query = new QueryBuilder()
      .fields(["width", "height", "image_id"])
      .where(`id = (${id})`)
      .build();

    return this.request({
      body: query,
      resource: "/event_logos",
    });
  },

  async getGamesByRating(): Promise<RatedGameResponse[] | undefined> {
    const query = new QueryBuilder()
      .fields(["name", "cover.image_id"])
      .sort("aggregated_rating", "desc")
      .where(
        "aggregated_rating_count > 20 & aggregated_rating != null & rating != null & category = 0"
      )
      .limit(12)
      .build();

    return this.request<RatedGameResponse[]>({
      body: query,
      resource: "/games",
    });
  },

  async getEvents(): Promise<UpcomingEventsResponse | undefined> {
    const query = new QueryBuilder()
      .fields([
        "checksum",
        "created_at",
        "description",
        "end_time",
        "event_logo",
        "event_networks",
        "games",
        "live_stream_url",
        "name",
        "slug",
        "start_time",
        "time_zone",
        "updated_at",
        "videos",
      ])
      .sort("start_time", "asc")
      .where(`start_time >= ${getTimeStamp()}`)
      .limit(10)
      .build();

    return this.request<UpcomingEventsResponse>({
      body: query,
      resource: "/events",
    });
  },

  async getGameById(
    gameId: number | null
  ): Promise<FullGameInfoResponse | undefined> {
    if (!gameId) return;
    const query = new QueryBuilder()
      .fields([
        "name",
        "summary",
        "aggregated_rating",
        "cover.image_id",
        "genres.name",
        "screenshots.image_id",
        "release_dates.platform.name",
        "release_dates.human",
        "involved_companies.developer",
        "involved_companies.publisher",
        "involved_companies.company.name",
        "game_modes.name",
        "game_engines.name",
        "player_perspectives.name",
        "themes.name",
        "external_games.category",
        "external_games.name",
        "external_games.url",
        "similar_games.name",
        "similar_games.cover.image_id",
        "websites.url",
        "websites.category",
        "websites.trusted",
      ])
      .where(`id = (${gameId})`)
      .build();

    const response = await this.request<FullGameInfoResponse[]>({
      body: query,
      resource: "/games",
    });

    if (response?.length) {
      return response[0];
    }

    return undefined;
  },

  async getGameScreenshots(
    gameId: number | null | undefined
  ): Promise<{ id: number; screenshots: FullGameInfoResponse["screenshots"] }> {
    if (!gameId) return { id: 0, screenshots: [] };

    const query = new QueryBuilder()
      .fields(["screenshots.image_id"])
      .where(`id = (${gameId})`)
      .build();

    const response = await this.request<
      Array<{ id: number; screenshots: FullGameInfoResponse["screenshots"] }>
    >({
      body: query,
      resource: "/games",
    });

    if (!response || (response !== undefined && !response[0])) {
      return { id: 0, screenshots: [] };
    }

    return response[0];
  },

  async getGameRating(
    gameId: number | null | undefined
  ): Promise<
    | { id: number; aggregated_rating: number }
    | { id: null; aggregated_rating: null }
  > {
    if (!gameId) return { id: null, aggregated_rating: null };

    const query = new QueryBuilder()
      .fields(["aggregated_rating"])
      .where(`id = (${gameId})`)
      .build();

    const response = await this.request<
      Array<{ id: number; aggregated_rating: number }>
    >({
      body: query,
      resource: "/games",
    });

    if (!response || !response[0]) {
      return { id: null, aggregated_rating: null };
    }

    return response[0];
  },

  async getSimilarGames(
    gameId: number | null | undefined
  ): Promise<
    | { id: number; similar_games: FullGameInfoResponse["similar_games"] }
    | { id: null; similar_games: [] }
  > {
    if (!gameId) {
      return { id: null, similar_games: [] };
    }

    const query = new QueryBuilder()
      .fields([
        "genres.name",
        "similar_games.name",
        "similar_games.cover.image_id",
      ])
      .where(`id = (${gameId})`)
      .build();

    const response = await this.request<
      Array<{
        id: number;
        similar_games: FullGameInfoResponse["similar_games"];
      }>
    >({
      body: query,
      resource: "/games",
    });

    if (!response || (response !== undefined && response[0] === undefined)) {
      return {
        id: null,
        similar_games: [],
      };
    }

    return response[0];
  },
  async getGameGenres(
    gameId: number | null | undefined
  ): Promise<Array<GenresResponse> | Array<{ id: null; genres: [] }>> {
    if (!gameId) return [];

    const query = new QueryBuilder()
      .fields(["genres.name"])
      .where(`id = (${gameId})`)
      .build();

    const response = await this.request<
      Array<GenresResponse> | Array<{ id: null; genres: [] }>
    >({
      body: query,
      resource: "/games",
    });

    if (!response) {
      return [];
    }

    return response;
  },

  async getNextMonthReleases(
    ids: number[]
  ): Promise<UpcomingReleaseResponse[] | []> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const query = new QueryBuilder()
      .fields([
        "name",
        "cover.image_id",
        "first_release_date",
        "release_dates.platform.name",
        "release_dates.human",
      ])
      .sort("first_release_date", "asc")
      .where(`id = (${ids.join(",")})`)
      .build();

    const response = await this.request<UpcomingReleaseResponse[] | []>({
      body: query,
      resource: "/games",
    });

    if (!response) {
      return [];
    }

    return response;
  },
  async getPlatforms() {
    const query = new QueryBuilder().fields(["name"]).build();

    return this.request({
      body: query,
      resource: "/platforms",
    });
  },

  async search({
    name = "",
    fields,
  }: {
    name: null | string;
    fields?: Record<string, string>;
  }): Promise<SearchResponse[] | undefined> {
    if (!name) return;

    console.log("IGDB API::Search for: ", { name, fields });

    let filters = "";

    if (fields && Object.values(fields).length !== 0) {
      const filterConditions = Object.entries(fields)
        .map(([key, value]) => {
          if (!value) {
            return;
          }
          if (Array.isArray(value)) {
            return `${key}=(${value.join(",")})`;
          }
          return `${key}="${value}"`;
        })
        .join(" & ");
      if (filterConditions) {
        filters = `& ${filterConditions}`;
      }
    }

    const query = new QueryBuilder()
      .fields([
        "name",
        "summary",
        "platforms.name",
        "release_dates.human",
        "first_release_date",
        "category",
        "cover.image_id",
      ])
      .where(`cover.image_id != null ${filters}`)
      .search(normalizeTitle(normalizeString(name)))
      .limit(100)
      .build();

    console.log({ query });

    return this.request<SearchResponse[]>({
      body: query,
      resource: "/games",
    });
  },

  async getArtworks(gameId: number): Promise<Artwork[] | undefined> {
    const query = new QueryBuilder()
      .fields([
        "alpha_channel",
        "animated",
        "checksum",
        "game",
        "height",
        "image_id",
        "url",
        "width",
      ])
      .where(`game = ${gameId}`)
      .build();

    return this.request<Artwork[] | undefined>({
      body: query,
      resource: "/artworks",
    });
  },
  async getPlatformId(
    platformName: string
  ): Promise<{ platformId: Array<{ id: number; name: string }> } | undefined> {
    const query = new QueryBuilder()
      .fields(["id", "name"])
      .search(platformName)
      .limit(1)
      .build();

    return this.request({
      body: query,
      resource: "/platforms",
    });
  },
  async getGameByName(
    gameName: string
  ): Promise<IgdbGameResponseItem[] | undefined> {
    const query = new QueryBuilder()
      .fields(["name", "cover.url", "cover.image_id", "version_title"])
      .search(gameName)
      .build();

    return this.request<IgdbGameResponseItem[]>({
      body: query,
      resource: "/games",
    });
  },
};

export default igdbApi;
