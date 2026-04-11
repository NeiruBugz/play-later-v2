import type { GameSearchResult } from "@/data-access-layer/services/igdb/types";

export interface IgdbSearchHandlerInput {
  query: string;
  offset?: number;
}

export type IgdbSearchHandlerOutput = GameSearchResult;
