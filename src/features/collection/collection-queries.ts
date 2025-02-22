import { prisma } from '@/infra/prisma/client';
import type {
  AcquisitionType,
  BacklogItemStatus,
} from '@/domain/entities/BacklogItem';

export async function createGame(gameData: {
  title: string;
  description: string | null;
  releaseDate: Date | null;
  aggregatedRating: number | null;
  igdbId: number;
  screenshots:
    | {
        connectOrCreate: {
          where: { id: number };
          create: { id: number; image_id: string };
        }[];
      }
    | undefined;
  genres:
    | {
        connectOrCreate: {
          where: { id: number };
          create: { id: number; name: string };
        }[];
      }
    | undefined;
  coverImage: string | null;
}) {
  const screenshots = gameData.screenshots?.connectOrCreate ?? [];
  const genres = gameData.genres?.connectOrCreate ?? [];
  return prisma.game.create({
    data: {
      ...gameData,
      screenshots: {
        connectOrCreate: screenshots,
      },
      genres: {
        connectOrCreate: genres,
      },
    },
  });
}

export async function createBacklogRecord(backlogData: {
  status: BacklogItemStatus;
  acquisitionType: AcquisitionType;
  platform: string;
  gameId: string;
  userId: string;
}) {
  return prisma.backlogItem.create({
    data: backlogData,
  });
}

export async function findExistingGame(igdbId: number) {
  return prisma.game.findUnique({
    where: { igdbId: igdbId },
  });
}
