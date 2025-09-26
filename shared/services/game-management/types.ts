import type { AcquisitionType, BacklogItemStatus } from "@prisma/client";

import type { BaseService, ServiceResponse } from "../types";

// Game Management Service specific types

export interface AddToCollectionParams {
  game: {
    igdbId: number;
  };
  backlogItem: {
    backlogStatus: BacklogItemStatus;
    acquisitionType: AcquisitionType;
    platform?: string;
  };
}

export interface RemoveFromCollectionParams {
  backlogItemId: number;
}

export interface GameManagementResult {
  id: string;
  title: string;
  igdbId: number;
  coverUrl?: string;
}

// Service interface for type safety
export interface GameManagementService extends BaseService {
  addGameToCollection(
    params: AddToCollectionParams
  ): Promise<ServiceResponse<GameManagementResult>>;

  removeGameFromCollection(
    params: RemoveFromCollectionParams
  ): Promise<ServiceResponse<void>>;
}
