import { type Game, GameStatus } from "@prisma/client";

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
