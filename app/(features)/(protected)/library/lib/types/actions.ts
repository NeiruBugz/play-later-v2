import { Game } from "@prisma/client";
import { HowLongToBeatEntry } from "howlongtobeat";

import { FullGameInfoResponse } from "@/lib/types/igdb";
import { LibraryData } from "@/lib/types/library";

export type FetcherAndProcessor = (
  params: URLSearchParams
) => Promise<LibraryData>;

// Combination of own Game model, HowLongToBeat game model and IGDB Game response
export type GameResponseCombined = Game &
  HowLongToBeatEntry &
  FullGameInfoResponse;

export type ResponsePreparer = ({
  gameId,
  isFromWishlist,
}: {
  gameId: Game["id"];
  isFromWishlist?: boolean;
}) => Promise<GameResponseCombined> | void;
