import { GameStatus, PurchaseType } from "@prisma/client";

import { uppercaseToNormal } from "./string-functions";

export function mapPlatformToSelectOption(value?: string) {
  if (!value) {
    return "";
  }

  if (value === "INPROGRESS") {
    return "Playing";
  }

  if (value === "FULL_COMPLETION") {
    return "100% Complete";
  }

  return uppercaseToNormal(value);
}

export function mapStatusForInfo(value: GameStatus) {
  const statusMapping = {
    ABANDONED: "Abandoned",
    BACKLOG: "Backlogged",
    COMPLETED: "Completed",
    FULL_COMPLETION: "100% Complete",
    INPROGRESS: "Playing",
    SHELVED: "Shelved",
  };

  return statusMapping[value] || value;
}

export const DescriptionStatusMapping: Record<GameStatus, string> = {
  [GameStatus.ABANDONED]: "You won't return to this game",
  [GameStatus.BACKLOG]:
    "Game is put on shelf for some time, but you haven't started playing it yet",
  [GameStatus.COMPLETED]: "Game is completed",
  [GameStatus.FULL_COMPLETION]: "Game is completed by 100%",
  [GameStatus.INPROGRESS]: "Game is currently being played",
  [GameStatus.SHELVED]: "Started playing, but shelved for the best times",
};

export const DescriptionPurchaseTypeMapping: Record<PurchaseType, string> = {
  [PurchaseType.DIGITAL]: "You have the game in your digital library",
  [PurchaseType.PHYSICAL]:
    "You have the game on a disc, cartridge or other physical ",
  [PurchaseType.SUBSCRIPTION]:
    "Game from Xbox Game Pass, PlayStation Plus or Nintendo Switch Online",
};

export const PurchaseTypeToFormLabel: Record<PurchaseType, string> = {
  DIGITAL: "Digital",
  PHYSICAL: "Physical",
  SUBSCRIPTION: "Subscription",
};
