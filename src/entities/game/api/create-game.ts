import type { Game } from "@prisma/client";
import { prisma } from "@/src/shared/api";

type CreateGameInput = {
  game: Omit<Game, "id" | "createdAt" | "updatedAt" | "userId">;
} & { userId: string };

export async function createGame(payload: CreateGameInput) {
  try {
    const { game, userId } = payload;

    const createdGame = await prisma.game.create({
      data: {
        igdbId: game.igdbId,
        title: game.title,
        coverImage: game.coverImage,
        hltbId: game.hltbId === "" ? null : game.hltbId,
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

    return { createdGame };
  } catch (e) {
    console.error(e);
  }
}
