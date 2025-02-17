import { Game } from '@/domain/entities/Game';
import {
  AcquisitionType,
  BacklogItem,
  BacklogItemStatus,
} from '@/domain/entities/BacklogItem';
import { GameRepository } from '@/domain/repositories/GameRepository';
import { BacklogRepository } from '@/domain/repositories/BacklogRepository';
import { Screenshot } from '@/domain/entities/Screenshot';
import { Genre } from '@/domain/entities/Genre';

export interface AddGameToBacklogParams {
  userId: string;
  igdbGame: Partial<Game> & {
    igdbId: number;
    name: string;
    coverImage?: string | null;
    description: string;
    releaseDate: Date | null;
    aggregatedRating: number | null;
    screenshots?: Screenshot[];
    genres?: Genre[];
  };
  status: string;
  platform: string;
  acquisitionType: string;
}

export async function addGameToBacklog(
  params: AddGameToBacklogParams,
  gameRepository: GameRepository,
  backlogRepository: BacklogRepository,
): Promise<BacklogItem> {
  let game = await gameRepository.findGameByIgdbId(params.igdbGame.igdbId);

  if (!game) {
    game = await gameRepository.create(params.igdbGame);
  }

  const backlogItem = await backlogRepository.create({
    userId: params.userId,
    platform: params.platform,
    status: params.status as BacklogItemStatus,
    acquisitionType: params.acquisitionType as AcquisitionType,
    gameId: game.id,
  });

  return backlogItem;
}
