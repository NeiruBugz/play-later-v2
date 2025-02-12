import { Game } from '@/domain/entities/Game';

export interface FilterParams {
  platform?: string;
  status?: string;
  search?: string;
  page?: number;
}

export interface GameWithBacklogItems {
  game: Game;
  backlogItems: Game['backlogItems'];
}

export interface GameRepository {
  getUserGamesWithGroupedBacklog(
    userId: string,
    params: FilterParams,
    itemsPerPage?: number,
  ): Promise<{ collection: GameWithBacklogItems[]; count: number }>;
  findGameByIgdbId(igdbId: number): Promise<Game | null>;
  create(
    gameData: Partial<Game> & { igdbId: number; name: string },
  ): Promise<Game>;
}
