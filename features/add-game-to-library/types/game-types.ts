import { FullGameInfoResponse } from '../../../shared/types/igdb.types';

export type IGDBGenres = FullGameInfoResponse['genres'];

export type IGDBScreenshots = FullGameInfoResponse['screenshots'];

export type PreparedGameData = {
  igdbId: number;
  name: string;
  description: string | null;
  releaseDate: Date | null;
  aggregatedRating: number | null;
  screenshots?: IGDBScreenshots;
  genres?: IGDBGenres;
  coverImage: string | null;
};
