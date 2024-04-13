"use server";

import { getServerUserId } from "@/auth";
import { HowLongToBeatService } from "howlongtobeat";

import igdbApi from "@/lib/igdb-api";
import { prisma } from "@/lib/prisma";

import {
  GameResponseCombined,
  ResponsePreparer,
} from "@/app/(protected)/library/lib/types/actions";

export const getGameWithAdapter: ResponsePreparer = async ({
  gameId,
  isFromWishlist = false,
}) => {
  const userId = await getServerUserId();
  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
      userId,
      isWishlisted: isFromWishlist,
    },
  });

  if (!game) {
    throw new Error("Game not found");
  }

  let result = { ...game };

  if (game.howLongToBeatId) {
    const howLongToBeatService = new HowLongToBeatService();
    const howLongToBeatDetails = await howLongToBeatService.detail(
      game.howLongToBeatId
    );
    result = { ...howLongToBeatDetails, ...result };
  }

  if (game.igdbId) {
    const igdbDetails = await igdbApi.getGameById(game.igdbId);
    if (igdbDetails?.length) {
      const [igdbGame] = igdbDetails;
      result = { ...igdbGame, ...result };
    }
  }

  return result as GameResponseCombined;
};
