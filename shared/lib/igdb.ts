import { env } from "@/env.mjs";

import { API_URL, TOKEN_URL } from "@/shared/config/igdb";
import {
  type Artwork,
  type DLCAndExpansionListResponse,
  type Event,
  type FranchiseGamesResponse,
  type FullGameInfoResponse,
  type GenresResponse,
  type IgdbGameResponseItem,
  type RatedGameResponse,
  type RequestOptions,
  type SearchResponse,
  type TimeToBeatsResponse,
  type TwitchTokenResponse,
  type UpcomingEventsResponse,
  type UpcomingReleaseResponse,
} from "@/shared/types";

const asError = (thrown: unknown): Error => {
  if (thrown instanceof Error) return thrown;
  try {
    return new Error(JSON.stringify(thrown));
  } catch {
    return new Error(String(thrown));
  }
};

const MILLISECONDS_TO_SECONDS = 1000;
const TOP_RATED_GAMES_LIMIT = 12;
const UPCOMING_EVENTS_LIMIT = 10;
const SEARCH_RESULTS_LIMIT = 100;

const getTimeStamp = (): number =>
  Math.floor(Date.now() / MILLISECONDS_TO_SECONDS);

function normalizeString(input: string): string {
  return input
    .toLowerCase()
    .replace(/[:-]/g, "")
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
    this.query += `fields ${fields.join(", ")};`;
    return this;
  }

  sort(field: string, order: "asc" | "desc" = "asc"): this {
    this.query += `sort ${field} ${order};`;
    return this;
  }

  where(condition: string): this {
    this.query += `where ${condition};`;
    return this;
  }

  limit(count: number): this {
    this.query += `limit ${count};`;
    return this;
  }

  search(term: string): this {
    this.query += `search "${term}";`;
    return this;
  }

  build(): string {
    return this.query.trim();
  }
}

const igdbApi = {
  token: null as TwitchTokenResponse | null,
  tokenExpiry: 0 as number,

  async fetchToken(): Promise<TwitchTokenResponse | undefined> {
    try {
      const res = await globalThis.fetch(TOKEN_URL, {
        cache: "no-store",
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch token: ${res.statusText}`);
      }
      const token = (await res.json()) as unknown as TwitchTokenResponse;
      this.token = token;
      const SAFETY_MARGIN_SECONDS = 60;
      this.tokenExpiry =
        getTimeStamp() + token.expires_in - SAFETY_MARGIN_SECONDS;
      return token;
    } catch (thrown) {
      this.handleError(thrown);
      return undefined;
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

      if (accessToken === undefined) {
        this.handleError(new Error("Unauthorized: No valid token available."));
        return undefined;
      }

      const response = await globalThis.fetch(`${API_URL}${options.resource}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,

          "Client-ID": env.IGDB_CLIENT_ID,
        },
        method: "POST",
        body: options.body,
      });

      if (!response.ok) {
        console.error(response);
        throw new Error(
          `IGDB API error: ${response.statusText} ${JSON.stringify(response)}`
        );
      }

      return (await response.json()) as unknown as T;
    } catch (thrown) {
      this.handleError(thrown);
      return undefined;
    }
  },

  handleError(thrown: unknown): void {
    const error = asError(thrown);

    console.error(`${error.name}: ${error.message}`);

    if (error.stack !== undefined) console.error(error.stack);
  },

  async getEventLogo(
    id: Event["event_logo"]
  ): Promise<
    | Array<{ height: number; id: number; image_id: string; width: number }>
    | undefined
  > {
    if (id === undefined) return undefined;
    let queryId: number = 0;
    if (typeof id === "object") {
      queryId = id.id;
    } else {
      queryId = id;
    }
    const query = new QueryBuilder()
      .fields(["width", "height", "image_id"])
      .where(`id = (${queryId})`)
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
      .limit(TOP_RATED_GAMES_LIMIT)
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
      .limit(UPCOMING_EVENTS_LIMIT)
      .build();

    return this.request<UpcomingEventsResponse>({
      body: query,
      resource: "/events",
    });
  },

  async getGameById(
    gameId: number | null
  ): Promise<FullGameInfoResponse | undefined> {
    if (gameId === null) return undefined;
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
        "similar_games.release_dates.human",
        "similar_games.first_release_date",
        "websites.url",
        "websites.category",
        "websites.trusted",
        "franchise",
        "franchises",
        "game_type",
        "game_type.type",
      ])
      .where(`id = (${gameId})`)
      .build();

    const response = await this.request<FullGameInfoResponse[]>({
      body: query,
      resource: "/games",
    });

    if (response !== undefined && response.length > 0) {
      return response[0];
    }

    return undefined;
  },

  async getGameScreenshots(
    gameId: number | null | undefined
  ): Promise<{ id: number; screenshots: FullGameInfoResponse["screenshots"] }> {
    if (gameId === null || gameId === undefined)
      return { id: 0, screenshots: [] };

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

    if (response?.[0] === undefined) {
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
    if (gameId === null || gameId === undefined) {
      return { id: null, aggregated_rating: null };
    }

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

    if (!response?.[0]) {
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
    if (gameId === null || gameId === undefined) {
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

    if (response?.[0] === undefined) {
      return {
        id: null,
        similar_games: [],
      };
    }

    return response[0];
  },
  async getGameGenres(
    gameId: number | null | undefined
  ): Promise<GenresResponse[] | Array<{ id: null; genres: [] }>> {
    if (gameId === null || gameId === undefined) {
      return [];
    }

    const query = new QueryBuilder()
      .fields(["genres.name"])
      .where(`id = (${gameId})`)
      .build();

    const response = await this.request<
      GenresResponse[] | Array<{ id: null; genres: [] }>
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
    if (ids.length === 0) {
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

    if (response === undefined) {
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
    if (name === null) {
      return undefined;
    }

    let filters = "";

    if (fields && Object.values(fields).length !== 0) {
      const filterConditions = Object.entries(fields)
        .map(([key, value]) => {
          if (!value) {
            return null;
          }

          const fieldName = key === "platform" ? "platforms" : key;

          if (Array.isArray(value)) {
            return `${fieldName}=(${value.join(",")})`;
          }
          return `${fieldName} = (${value})`;
        })
        .filter((condition): condition is string => condition !== null)
        .join(" & ");

      if (filterConditions) {
        filters = ` & ${filterConditions}`;
      }
    }

    const query = new QueryBuilder()
      .fields([
        "name",
        "platforms.name",
        "release_dates.human",
        "first_release_date",
        "category",
        "cover.image_id",
      ])
      .where(`cover.image_id != null ${filters}`)
      .search(normalizeTitle(normalizeString(name)))
      .limit(SEARCH_RESULTS_LIMIT)
      .build();

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
  async getGameTimeToBeats(
    gameId: number
  ): Promise<TimeToBeatsResponse[] | undefined> {
    const query = new QueryBuilder()
      .fields(["hastily", "normally", "completely", "count"])
      .where(`game_id = ${gameId}`)
      .build();

    return this.request<TimeToBeatsResponse[]>({
      body: query,
      resource: "/game_time_to_beats",
    });
  },

  async getGameDLCsAndExpansions(
    gameId: number
  ): Promise<DLCAndExpansionListResponse[] | undefined> {
    const query = new QueryBuilder()
      .fields([
        "expansions",
        "expansions.name",
        "expansions.cover.url",
        "expansions.cover.image_id",
        "expansions.release_dates",
      ])
      .where(`id = ${gameId}`)
      .build();

    return this.request<DLCAndExpansionListResponse[]>({
      body: query,
      resource: "/games",
    });
  },

  async getGameFranchiseGames(
    franchiseId: number
  ): Promise<FranchiseGamesResponse[] | undefined> {
    const query = new QueryBuilder()
      .fields([
        "name",
        "id",
        "games.name",
        "games.cover.image_id",
        "games.game_type",
        "games.first_release_date",
      ])
      .where(`id = ${franchiseId}`)
      .sort("first_release_date", "desc")
      .build();

    return this.request<FranchiseGamesResponse[]>({
      body: query,
      resource: "/franchises",
    });
  },

  async getGameBySteamAppId(
    steamAppId: number
  ): Promise<{ id: number; name: string } | undefined> {
    if (!steamAppId) return undefined;

    const steamUrl = `https://store.steampowered.com/app/${steamAppId}`;

    const query = new QueryBuilder()
      .fields(["name"])
      .where(`external_games.category = 1 & external_games.url = "${steamUrl}"`)
      .limit(1)
      .build();

    const response = await this.request<FullGameInfoResponse[]>({
      body: query,
      resource: "/games",
    });

    if (response?.[0] !== undefined) {
      return response[0];
    }

    return undefined;
  },
};

export default igdbApi;
