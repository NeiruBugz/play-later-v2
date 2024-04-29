import { FullGameInfoResponse } from "@/src/packages/types/igdb";
import { Game } from "@prisma/client";
import { HowLongToBeatEntry } from "howlongtobeat";


export type FetcherAndProcessor = (
  params: URLSearchParams
) => Promise<LibraryData>;

// Combination of own Game model, HowLongToBeat game model and IGDB Game response
export type GameResponseCombined = FullGameInfoResponse &
  Game &
  HowLongToBeatEntry;

export type ResponsePreparer = ({
  gameId,
  isFromWishlist,
}: {
  gameId: Game["id"];
  isFromWishlist?: boolean;
}) => Promise<GameResponseCombined> | void;

export type LibraryData = {
  list: Game[];
};
