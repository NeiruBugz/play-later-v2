import { type FranchiseGamesResponse } from "@/shared/types";

export type FranchiseProps = {
  name: string;
  games: FranchiseGamesResponse["games"];
};
