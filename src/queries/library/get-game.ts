import { getServerUserId } from "@/auth";
import igdbApi from "@/src/packages/igdb-api";
import { prisma } from "@/src/packages/prisma";
import {
  GameResponseCombined,
  ResponsePreparer,
} from "@/src/types/library/actions";
import { HowLongToBeatService } from "howlongtobeat";
import { notFound } from "next/navigation";

export const getGameWithAdapter: ResponsePreparer = async ({
  gameId,
  isFromWishlist = false,
}) => {
  const userId = await getServerUserId();
  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
      isWishlisted: isFromWishlist,
      userId,
    },
  });

  if (!game) {
    notFound();
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
