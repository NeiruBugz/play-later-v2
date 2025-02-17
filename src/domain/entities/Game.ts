import { Screenshot } from '@/domain/entities/Screenshot';
import type { BacklogItem } from './BacklogItem';
import { Genre } from '@/domain/entities/Genre';

export interface Game {
  id: string;
  igdbId: number;
  hltbId: string | null;
  title: string;
  description: string | null;
  coverImage: string | null;
  releaseDate: Date | null;
  mainStory: number | null;
  mainExtra: number | null;
  completionist: number | null;
  steamAppId: number | null;
  createdAt: Date;
  updatedAt: Date;
  backlogItems?: BacklogItem[];
  screenshots?: Screenshot[];
  genres?: Genre[];
  aggregatedRating: number | null;
}
