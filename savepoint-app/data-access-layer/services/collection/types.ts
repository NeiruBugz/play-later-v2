import type { Game, LibraryItem } from "@prisma/client";

import type { FilterParams } from "@/shared/types/collection";

import type { BaseService, ServiceResponse } from "../types";

export interface CollectionParams extends Omit<FilterParams, "page"> {
  userId: string;
  page?: number;
}

export type GameWithLibraryItems = Game & {
  libraryItems: LibraryItem[];
};

export interface CollectionItem {
  game: GameWithLibraryItems;
  libraryItems: LibraryItem[];
}

export interface CollectionResult {
  collection: CollectionItem[];
  count: number;
}

export interface CollectionService extends BaseService {
  getCollection(
    params: CollectionParams
  ): Promise<ServiceResponse<CollectionResult>>;
  getUserPlatforms(userId: string): Promise<ServiceResponse<string[]>>;
}
