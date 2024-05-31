import type { Game, GameStatus } from "@prisma/client";
import type { FormState } from "@/src/components/library/library/filters/types";
import type { FullGameInfoResponse } from "@/src/packages/types/igdb";

export const calculateTotalBacklogTime = (
  backlogged: { gameplayTime: null | number }[]
): number => {
  return backlogged.reduce(
    (acc, game) => acc + (game.gameplayTime ? game.gameplayTime : 0),
    0
  );
};

export const getListBasedOnStatus = ({
  abandoned,
  backlogged,
  completed,
  currentStatus,
  fullyCompleted,
  inprogress,
  shelved,
}: {
  abandoned: Game[];
  backlogged: Game[];
  completed: Game[];
  currentStatus: GameStatus;
  fullyCompleted: Game[];
  inprogress: Game[];
  shelved: Game[];
}): Game[] => {
  switch (currentStatus) {
    case "INPROGRESS":
      return inprogress;
    case "ABANDONED":
      return abandoned;
    case "BACKLOG":
      return backlogged;
    case "COMPLETED":
      return completed;
    case "FULL_COMPLETION":
      return fullyCompleted;
    case "SHELVED":
      return shelved;
    default:
      return [];
  }
};

export const uniqueRecords = (
  records: FullGameInfoResponse["release_dates"]
) =>
  records && records.length
    ? records.filter(
        (record, index, self) =>
          index ===
          self.findIndex(
            (r) =>
              r.human === record.human &&
              r.platform.name === record.platform.name
          )
      )
    : records;

export const buildUrl = (pathname: string, filters: FormState) => {
  const { order, purchaseType, search, sortBy, status } = filters;
  let url = pathname;

  url += `?status=${status}`;
  url += `&order=${order}`;
  url += `&sortBy=${sortBy}`;

  if (purchaseType) {
    url += `&purchaseType=${purchaseType}`;
  }
  if (search) {
    url += `&search=${search}`;
  }

  return url;
};
