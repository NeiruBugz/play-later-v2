import { GameStatus, PurchaseType } from "@prisma/client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const NINTENDO_PLATFORMS = [
  "wii u",
  "game boy advance",
  "wii",
  "game boy color",
  "game & watch",
  "nes",
];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function platformEnumToColor(value: string) {
  const fromHLTB = value.toLowerCase();

  const platformMapping = {
    PLAYSTATION: "playstation",
    XBOX: "xbox",
    NINTENDO: "nintendo",
    PC: "pc",
  };

  const forHTLB = () => {
    for (const platform of Object.keys(platformMapping)) {
      if (fromHLTB.includes(platform.toLowerCase())) {
        return platformMapping[platform as keyof typeof platformMapping];
      }
    }
    if (NINTENDO_PLATFORMS.includes(fromHLTB)) {
      return platformMapping.NINTENDO;
    }
    return platformMapping.PC;
  };

  return platformMapping[value as keyof typeof platformMapping] || forHTLB();
}

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

export function uppercaseToNormal(value?: string) {
  if (value === "PC") {
    return value;
  }
  return value ? `${value[0]}${value.slice(1).toLowerCase()}` : value;
}

export function nameFirstLiterals(name: string) {
  if (!name) {
    return "U";
  }

  const [firstName, lastName] = name.split(" ");
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName[0];
}

export function mapStatusForInfo(value: GameStatus) {
  const statusMapping = {
    BACKLOG: "Backlogged",
    INPROGRESS: "Playing",
    COMPLETED: "Completed",
    FULL_COMPLETION: "100% Complete",
    ABANDONED: "Abandoned",
    SHELVED: "Shelved",
  };

  return statusMapping[value] || value;
}

export function hasSelectedPlatformInList(
  platformFromList?: string,
  selectedPlatform?: string
) {
  if (!platformFromList || !selectedPlatform) {
    return false;
  }

  return platformFromList
    .toLowerCase()
    .includes(selectedPlatform.toLowerCase());
}

export function getRandomItem<Game>(array: Game[]): Game | undefined {
  if (array.length === 0) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
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
  PHYSICAL: "Physical",
  DIGITAL: "Digital",
  SUBSCRIPTION: "Subscription",
};
