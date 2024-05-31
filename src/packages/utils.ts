import { GameStatus, PurchaseType } from "@prisma/client";
import type { BackloggedWithUser } from "@/src/types/backlogs";
import type { PickerItem } from "@/src/types/library/actions";

const NINTENDO_PLATFORMS = [
  "wii u",
  "game boy advance",
  "wii",
  "game boy color",
  "game & watch",
  "nes",
];

export function platformEnumToColor(value: string) {
  const fromHLTB = value.toLowerCase();

  const platformMapping = {
    NINTENDO: "nintendo",
    PC: "pc",
    PLAYSTATION: "playstation",
    XBOX: "xbox",
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
    ABANDONED: "Abandoned",
    BACKLOG: "Backlogged",
    COMPLETED: "Completed",
    FULL_COMPLETION: "100% Complete",
    INPROGRESS: "Playing",
    SHELVED: "Shelved",
  };

  return statusMapping[value] || value;
}

export function getRandomItem(array: PickerItem[]): PickerItem | undefined {
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
  DIGITAL: "Digital",
  PHYSICAL: "Physical",
  SUBSCRIPTION: "Subscription",
};

export const isURL = (str: string) => {
  const urlRegex = /^(?:https?|ftp):\/\/(?:\w+\.)+\w+(?:\/\S*)?$/;
  return urlRegex.test(str);
};

export const processPlaythroughPayload = (payload: FormData) => {
  return {
    createdAt: new Date(),
    finishedAt: payload.get("finishedAt")
      ? new Date(payload.get("finishedAt") as string)
      : undefined,
    label: payload.get("label"),
    platform: payload.get("platform"),
    startedAt: payload.get("startedAt")
      ? new Date(payload.get("startedAt") as string)
      : new Date(),
  };
};

export const groupByUserName = (data?: BackloggedWithUser[]) => {
  if (!data) {
    return [];
  }

  const groupedData: Record<string, BackloggedWithUser[]> = {};
  data.forEach((item) => {
    const userName = item.user.name;
    if (!userName) {
      return;
    }
    if (!groupedData[userName]) {
      groupedData[userName] = [];
    }
    groupedData[userName].push(item);
  });
  return groupedData;
};
