import { prisma } from '../../../prisma/client';

export async function createGame(gameData: {
  title: string;
  description: string | null;
  releaseDate: Date | null;
  aggregatedRating: number | null;
  igdbId: number;
  screenshots: {
    create: {
      imageId: string;
    }[];
  };
  genres: {
    create: {
      genre: {
        connectOrCreate: {
          where: { id: number };
          create: { id: number; name: string };
        };
      };
    }[];
  };
  coverImage: string | null;
}) {
  return prisma.game.create({
    data: {
      title: gameData.title,
      description: gameData.description,
      releaseDate: gameData.releaseDate,
      aggregatedRating: gameData.aggregatedRating,
      igdbId: gameData.igdbId,
      coverImage: gameData.coverImage,
      screenshots: {
        create: gameData.screenshots.create,
      },
      genres: {
        create: gameData.genres.create,
      },
    },
  });
}

export async function findExistingGame(igdbId: number) {
  return prisma.game.findUnique({
    where: { igdbId: igdbId },
  });
}
