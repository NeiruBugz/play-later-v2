import type {
  GameRepository,
  GameWithBacklogItems,
} from '../../repositories/GameRepository';

export class GetUserWishlistedGamesGroupedBacklog {
  constructor(private gameRepository: GameRepository) {}

  async execute(
    userId: string,
    pageParam: string,
  ): Promise<{ wishlistedGames: GameWithBacklogItems[]; count: number }> {
    return await this.gameRepository.getUserWishlistedGamesGroupedBacklog(
      userId,
      pageParam,
    );
  }
}
