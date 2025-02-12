'use server';
import { getServerUserId } from '@/domain/auth/auth-service';
import { addGameToBacklog } from '@/domain/use-cases/backlog/addGameToBacklog';
import {
  CreateBacklogItem,
  CreateBacklogItemInput,
} from '@/domain/use-cases/backlog/createBacklogItem';
import { GetUniquePlatformsForUser } from '@/domain/use-cases/backlog/getUniquePlatforms';
import { PrismaBacklogRepository } from '@/infrastructure/repositories/PrismaBacklogRepository';
import { PrismaGameRepository } from '@/infrastructure/repositories/PrismaGameRepository';
import { redirect } from 'next/navigation';

export async function createBacklogItemAction(input: CreateBacklogItemInput) {
  const repo = new PrismaBacklogRepository();
  const useCase = new CreateBacklogItem(repo);
  return await useCase.execute(input);
}

export async function getUniqueUserPlatforms() {
  const userId = await getServerUserId();

  if (!userId) {
    redirect('/');
  }

  const repo = new PrismaBacklogRepository();
  const useCase = new GetUniquePlatformsForUser(repo);

  return await useCase.execute(userId);
}

export async function addGameToBacklogAction(params: {
  userId: string;
  igdbGame: { igdbId: number; name: string; coverImage?: string | null };
  status: string;
  platform: string;
  acquisitionType: string;
}) {
  const gameRepository = new PrismaGameRepository();
  const backlogRepository = new PrismaBacklogRepository();

  return await addGameToBacklog(params, gameRepository, backlogRepository);
}
