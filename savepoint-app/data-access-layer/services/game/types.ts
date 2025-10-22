import type { ServiceResult } from "@/data-access-layer/services/types";
import type { Game, LibraryItem } from "@prisma/client";

import type { FullGameInfoResponse, SearchResponse } from "@/shared/types/igdb";

export type GameSearchInput = {
  query: string;
  limit?: number;
  offset?: number;
  filters?: Record<string, string | string[]>;
};

export type CreateGameFromIgdbInput = {
  igdbId: number;
};

export type CreateGameInput = {
  igdbId: number;
  title: string;
  coverImage?: string | null;
  hltbId?: string | null;
  mainStory?: number | null;
  mainExtra?: number | null;
  completionist?: number | null;
  releaseDate?: Date | null;
  description?: string | null;
  steamAppId?: number | null;
};

export type UpdateGameInput = {
  title?: string;
  coverImage?: string | null;
  hltbId?: string | null;
  mainStory?: number | null;
  mainExtra?: number | null;
  completionist?: number | null;
  releaseDate?: Date | null;
  description?: string | null;
  steamAppId?: number | null;
};

export type GetGameInput = {
  gameId: string;
  userId?: string;
};

export type GameWithLibraryItems = Game & {
  libraryItems?: LibraryItem[];
};

export type IgdbSearchResult = SearchResponse;

export type IgdbGameDetails = FullGameInfoResponse;

export type GetGameResult = ServiceResult<{
  game: Game | GameWithLibraryItems;
}>;

export type SearchGamesResult = ServiceResult<{
  games: IgdbSearchResult[];
  total: number;
}>;

export type CreateGameResult = ServiceResult<{
  game: Game;
  created: boolean; // true if created, false if already existed
}>;

export type UpdateGameResult = ServiceResult<{
  game: Game;
}>;

export type GetGameDetailsResult = ServiceResult<{
  game: IgdbGameDetails;
}>;

export type FindOrCreateGameResult = ServiceResult<{
  game: Game;
  created: boolean;
}>;
