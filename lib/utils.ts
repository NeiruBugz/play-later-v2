import { Game, GameStatus, PurchaseType } from "@prisma/client"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const NINTENDO_PLATFORMS = [
  "wii u",
  "game boy advance",
  "wii",
  "game boy color",
  "game & watch",
  "nes",
]

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function platformEnumToColor(value: string) {
  const fromHLTB = value.toLowerCase()

  const platformMapping = {
    PLAYSTATION: "playstation",
    XBOX: "xbox",
    NINTENDO: "nintendo",
    PC: "pc",
  }

  const forHTLB = () => {
    for (const platform of Object.keys(platformMapping)) {
      if (fromHLTB.includes(platform.toLowerCase())) {
        return platformMapping[platform as keyof typeof platformMapping]
      }
    }
    if (NINTENDO_PLATFORMS.includes(fromHLTB)) {
      return platformMapping.NINTENDO
    }
    return platformMapping.PC
  }

  return platformMapping[value as keyof typeof platformMapping] || forHTLB()
}

export function mapPlatformToSelectOption(value?: string) {
  if (!value) {
    return ""
  }

  if (value === "FULL_COMPLETION") {
    return "100% Complete"
  }

  return uppercaseToNormal(value)
}

export function uppercaseToNormal(value?: string) {
  if (value === "PC") {
    return value
  }
  return value ? `${value[0]}${value.slice(1).toLowerCase()}` : value
}

export function nameFirstLiterals(name: string) {
  if (!name) {
    return "U"
  }

  const [firstName, lastName] = name.split(" ")
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName[0]
}

export function mapStatusToUI(value: GameStatus) {
  const statusMapping = {
    BACKLOG: "Put in backlog",
    INPROGRESS: "Start playing",
    COMPLETED: "Complete",
    ABANDONED: "Abandon",
    FULL_COMPLETION: "100% Complete",
  }

  return statusMapping[value] || value
}

export function mapStatusForInfo(value: GameStatus) {
  const statusMapping = {
    BACKLOG: "Backlogged",
    INPROGRESS: "Playing",
    COMPLETED: "Completed",
    ABANDONED: "Abandoned",
    FULL_COMPLETION: "100% Complete",
  }

  return statusMapping[value] || value
}

export function prepareDescription(value: string) {
  if (!value) {
    return ""
  }

  const purified = value.replace(" ...Read More", "").trim()
  const metaIndex = purified.indexOf("How long is")
  return metaIndex !== -1 ? purified.slice(0, metaIndex) : purified
}

export function hasSelectedPlatformInList(
  platformFromList?: string,
  selectedPlatform?: string
) {
  if (!platformFromList || !selectedPlatform) {
    return false
  }

  return platformFromList.toLowerCase().includes(selectedPlatform.toLowerCase())
}

export function getRandomItem<Game>(array: Game[]): Game | undefined {
  if (array.length === 0) {
    return
  }

  const randomIndex = Math.floor(Math.random() * array.length)
  return array[randomIndex]
}
export function groupByYear(records: Game[]): Map<number, Game[]> {
  const grouped = new Map<number, Game[]>()

  records.forEach((record) => {
    const year = new Date(record.createdAt).getFullYear()
    if (!grouped.has(year)) {
      grouped.set(year, [])
    }
    grouped.get(year)!.push(record)
  })

  return new Map([...grouped].sort().reverse())
}

export const DescriptionStatusMapping: Record<GameStatus, string> = {
  [GameStatus.ABANDONED]:
    "Game is either put on shelf forever, either you paused playing it for some time",
  [GameStatus.BACKLOG]:
    "Game is put on shelf for some time, but you haven't started playing it yet",
  [GameStatus.COMPLETED]: "Game is completed",
  [GameStatus.FULL_COMPLETION]: "Game is completed by 100%",
  [GameStatus.INPROGRESS]: "Game is currently being played",
}

export const DescriptionPurchaseTypeMapping: Record<PurchaseType, string> = {
  [PurchaseType.DIGITAL]: "You have the game in your digital library",
  [PurchaseType.PHYSICAL]:
    "You have the game on a disc, cartridge or other physical ",
  [PurchaseType.SUBSCRIPTION]:
    "Game from Xbox Game Pass, PlayStation Plus or Nintendo Switch Online",
}

export const StatusToUIMapping: Record<GameStatus, string> = {
  ABANDONED: "Abandoned",
  FULL_COMPLETION: "100% Completed",
  BACKLOG: "Backlog",
  INPROGRESS: "Playing",
  COMPLETED: "Completed",
}
