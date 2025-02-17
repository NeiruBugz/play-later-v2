'use server';

import { getServerUserId } from '@/domain/auth/auth-service';
import { GetGameById } from '@/domain/use-cases/game/getGameById';
import { GetUserGamesWithGroupedBacklog } from '@/domain/use-cases/game/getUserGamesWithGroupedBacklog';
import { GetUserWishlistedGamesGroupedBacklog } from '@/domain/use-cases/game/getUserWishlistedGamesGroupedBacklog';
import { IGDBClient } from '@/infrastructure/external-apis/igdb/client';
import { PrismaGameRepository } from '@/infrastructure/repositories/PrismaGameRepository';
import { redirect } from 'next/navigation';

export async function getUserGamesWithGroupedBacklogAction(
  params: Record<string, string | number>,
) {
  const userId = await getServerUserId();
  if (!userId) {
    console.error('Unable to find authenticated user');
    redirect('/');
  }

  const repository = new PrismaGameRepository();
  const useCase = new GetUserGamesWithGroupedBacklog(repository);

  return await useCase.execute(userId, params);
}

export async function getUserWishlistedGamesGroupedBacklog(pageParam: string) {
  const userId = await getServerUserId();

  if (!userId) {
    console.error('Unable to find authenticated user');
    redirect('/');
  }

  const repository = new PrismaGameRepository();
  const useCase = new GetUserWishlistedGamesGroupedBacklog(repository);

  return await useCase.execute(userId, pageParam);
}

export const searchGamesAction = async (query: string) => {
  const igdbClient = new IGDBClient();
  return await igdbClient.search({ name: query });
};

export const getIGDBGameData = async (igdbId: number) => {
  const igdbClient = new IGDBClient();
  return await igdbClient.getGameById(igdbId);
};

export async function getGameById(id: string) {
  const userId = await getServerUserId();
  if (!userId) {
    console.error('Unable to find authenticated user');
    redirect('/');
  }

  const repository = new PrismaGameRepository();
  const useCase = new GetGameById(repository);

  return await useCase.execute(id, userId);
}
