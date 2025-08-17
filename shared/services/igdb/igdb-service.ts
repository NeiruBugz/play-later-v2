import { BaseService, type ServiceResponse } from "../types";
import type { GameSearchParams, GameSearchResult, IIgdbService } from "./types";

export class IgdbService extends BaseService implements IIgdbService {
  // Basic service structure - implementation will be added in next step
  async searchGames(
    params: GameSearchParams
  ): Promise<ServiceResponse<GameSearchResult>> {
    // TODO: Implement in next commit
    throw new Error("Not implemented yet");
  }
}
