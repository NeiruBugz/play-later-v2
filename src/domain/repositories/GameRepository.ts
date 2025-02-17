import { Game } from '@/domain/entities/Game';
import { Genre } from '@/domain/entities/Genre';
import { Screenshot } from '@/domain/entities/Screenshot';

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
  findGameByIdWithUsersBacklog(
    gameId: string,
    userId: string,
  ): Promise<Game | null>;
  create(
    gameData: Partial<Game> & {
      igdbId: number;
      name: string;
      coverImage?: string | null;
      description?: string;
      releaseDate?: Date | null;
      screenshots?: Screenshot[];
      genres?: Genre[];
      aggregatedRating: number | null;
    },
  ): Promise<Game>;
  getUserWishlistedGamesGroupedBacklog(
    userId: string,
    pageParam: string,
  ): Promise<{ wishlistedGames: GameWithBacklogItems[]; count: number }>;
}
