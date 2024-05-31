import { HowLongToBeatService } from "howlongtobeat";
import { notFound } from "next/navigation";

import { getServerUserId } from "@/auth";

import { db } from "@/src/shared/api";
import igdbApi from "@/src/shared/api/igdb";
import type {
  GameResponseCombined,
  ResponsePreparer,
} from "@/src/shared/types";

const fetchAdditionalGameDetails = async (
  howLongToBeatId?: null | string,
  igdbId?: null | number
) => {
  const hltbPromise = howLongToBeatId
    ? new HowLongToBeatService().detail(howLongToBeatId)
    : Promise.resolve({});
  const igdbPromise = igdbId
    ? igdbApi.getGameById(igdbId)
    : Promise.resolve([]);

  const [howLongToBeatDetails, igdbDetails] = await Promise.all([
    hltbPromise,
    igdbPromise,
  ]);

  const igdbGame = igdbDetails?.length ? igdbDetails[0] : {};
  return { ...howLongToBeatDetails, ...igdbGame };
};

export const getGameWithAdapter: ResponsePreparer = async ({
  gameId,
  isFromWishlist = false,
}) => {
  const userId = await getServerUserId();
  const game = await db.game.findUnique({
    where: {
      id: gameId,
      isWishlisted: isFromWishlist,
      userId,
    },
  });

  if (!game) {
    notFound();
  }

  const additionalDetails = await fetchAdditionalGameDetails(
    game.howLongToBeatId,
    game.igdbId
  );
  return { ...additionalDetails, ...game } as GameResponseCombined;
};
