import { Game } from "@prisma/client";
import { HowLongToBeatEntry } from "howlongtobeat";
import { FullGameInfoResponse } from "@/src/packages/types/igdb";

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
  list: ListEntry[];
};

export type PickerItem = Pick<Game, "id" | "imageUrl" | "title">;

export type ListEntry = Pick<
  Game,
  | "createdAt"
  | "gameplayTime"
  | "howLongToBeatId"
  | "id"
  | "igdbId"
  | "imageUrl"
  | "status"
  | "title"
  | "updatedAt"
>;
