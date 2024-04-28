import { FullGameInfoResponse } from "@/src/lib/types/igdb";
import { Game, GameStatus } from "@prisma/client";

export const calculateTotalBacklogTime = (backlogged: Game[]): number => {
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
