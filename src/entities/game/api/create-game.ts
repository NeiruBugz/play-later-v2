import { prisma } from "@/src/shared/api";
import type { Game } from "@prisma/client";

type CreateGameInput = {
  game: Omit<Game, "id" | "createdAt" | "updatedAt" | "userId">;
};

export async function createGame(payload: CreateGameInput) {
  try {
    const { game } = payload;

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
      },
    });

    return { createdGame };
  } catch (e) {
    console.error(e);
  }
}
