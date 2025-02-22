import { Game } from '@/domain/entities/Game';
import { Genre } from '@/domain/entities/Genre';
import { Screenshot } from '@/domain/entities/Screenshot';

export interface AddGameToBacklogInput {
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

export interface CreateBacklogItemInput {
  userId: string;
  gameId: string;
  platform?: string;
  acquisitionType: 'PHYSICAL' | 'DIGITAL' | 'SUBSCRIPTION';
  status: 'TO_PLAY' | 'PLAYED' | 'PLAYING' | 'COMPLETED' | 'WISHLIST';
}

export interface GameWithBacklogItems {
  game: Game;
  backlogItems: Game['backlogItems'];
}
