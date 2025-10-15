import type { Game, LibraryItem } from "@prisma/client";

import type { FilterParams } from "@/shared/types/collection";

import type { BaseService, ServiceResponse } from "../types";

// Collection Service specific types
export interface CollectionParams extends Omit<FilterParams, "page"> {
  userId: string;
  page?: number;
}

// Type representing the game with its library items as returned by the repository
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
}
