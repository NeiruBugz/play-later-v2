import { GameRepository } from '@/domain/repositories/GameRepository';

export class GetGameById {
  constructor(private gameRepository: GameRepository) {}

  async execute(gameId: string, userId: string) {
    return await this.gameRepository.findGameByIdWithUsersBacklog(
      gameId,
      userId,
    );
  }
}
