import { BaseService } from "../types";
import type { CollectionParams, ICollectionService, CollectionResult } from "./types";
import type { ServiceResponse } from "../types";

export class CollectionService extends BaseService implements ICollectionService {
  // Basic service structure - implementation will be added in next step
  async getCollection(params: CollectionParams): Promise<ServiceResponse<CollectionResult>> {
    // TODO: Implement in next commit
    throw new Error("Not implemented yet");
  }
}