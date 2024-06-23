import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";
import { AcquisitionType, BacklogItemStatus, Game } from "@prisma/client";

type AddGameToBacklogInput = {
  game: Omit<Game, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;
  backlogItem: {
    backlogStatus: string;
    acquisitionType: string;
    platform?: string;
  }
}

async function saveGameAndAddToBacklog(payload: AddGameToBacklogInput) {
  const userId = await getServerUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  return await prisma.$transaction(async (prisma) => {
    const { game, backlogItem } = payload;

    const existingGame = await prisma.game.findUnique({
      where: {
        igdbId: game.igdbId,
      },
    });

    console.log("Game payload: ", { game })

    let savedGame;

    if (existingGame) {
      savedGame = existingGame;
    } else {
      savedGame = await prisma.game.create({
        data: {
          igdbId: game.igdbId,
          title: game.title,
          coverImage: game.coverImage,
          hltbId: game.hltbId === '' ? null : game.hltbId,
          mainExtra: game.mainExtra,
          mainStory: game.mainStory,
          completionist: game.completionist,
          releaseDate: game.releaseDate,
          description: game.description,
          User: {
            connect: {
              id: userId,
            },
          },
        },
      });
    }

    const backlogItemSaved = await prisma.backlogItem.create({
      data: {
        status: backlogItem.backlogStatus as unknown as BacklogItemStatus,
        acquisitionType: backlogItem.acquisitionType as unknown as AcquisitionType,
        platform: backlogItem.platform,
        User: {
          connect: {
            id: userId,
          },
        },
        game: {
          connect: {
            id: savedGame.id,
          },
        },
      },
    });

    return { savedGame, backlogItemSaved };
  });
}

export { saveGameAndAddToBacklog };
