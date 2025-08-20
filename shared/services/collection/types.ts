import type { BacklogItem, Game } from "@prisma/client";

import type { FilterParams } from "@/shared/types/collection";

import type { BaseService, ServiceResponse } from "../types";

// Collection Service specific types
export interface CollectionParams extends Omit<FilterParams, "page"> {
  userId: string;
  page?: number;
}

// Type representing the game with its backlog items as returned by the repository
export type GameWithBacklogItems = Game & {
  backlogItems: BacklogItem[];
};

export interface CollectionItem {
  game: GameWithBacklogItems;
  backlogItems: BacklogItem[];
}

export interface CollectionResult {
  collection: CollectionItem[];
  count: number;
}

export interface CollectionService extends BaseService {
  getCollection(
    params: CollectionParams
  ): Promise<ServiceResponse<CollectionResult>>;
}
