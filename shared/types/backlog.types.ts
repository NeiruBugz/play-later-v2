import { Game } from './entities/Game';
import { Genre } from './entities/Genre';
import { Screenshot } from './entities/Screenshot';

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
