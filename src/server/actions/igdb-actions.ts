'use server';

import { IGDBClient } from '@/infra/external-apis/igdb/client';

export const searchGamesAction = async (query: string) => {
  const igdbClient = new IGDBClient();
  return await igdbClient.search({ name: query });
};

export const getIGDBGameData = async (igdbId: number) => {
  const igdbClient = new IGDBClient();
  return await igdbClient.getGameById(igdbId);
};
