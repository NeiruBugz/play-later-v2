import type { GameSearchResult } from "@/data-access-layer/services/igdb/types";

export interface GameSearchHandlerInput {
  
  query: string;
  
  offset?: number;
}

export type GameSearchHandlerOutput = GameSearchResult;
