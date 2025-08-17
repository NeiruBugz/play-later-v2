import type { FilterParams } from "@/features/view-collection/lib/validation";
import type { BaseService, ServiceResponse } from "../types";

// Collection Service specific types
export interface CollectionParams extends FilterParams {
  userId: string;
}

export interface CollectionItem {
  game: {
    id: number;
    igdbId: number | null;
    name: string;
    cover: {
      id: number;
      image_id: string;
    } | null;
    platforms: {
      id: number;
      name: string;
    }[];
    backlogItems: {
      id: string;
      userId: string;
      status: string;
      platform: string | null;
      createdAt: Date;
      updatedAt: Date;
    }[];
  };
  backlogItems: {
    id: string;
    userId: string;
    status: string;
    platform: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

export interface CollectionResult {
  collection: CollectionItem[];
  count: number;
}

export interface ICollectionService extends BaseService {
  getCollection(params: CollectionParams): Promise<ServiceResponse<CollectionResult>>;
}