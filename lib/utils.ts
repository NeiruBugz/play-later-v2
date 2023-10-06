import { GameStatus } from "@prisma/client"
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

  const forHTLB = () => {
    if (fromHLTB.includes("playstation")) {
      return "playstation"
    } else if (fromHLTB.includes("xbox")) {
      return "xbox"
    } else if (
      fromHLTB.includes("nintendo") ||
      NINTENDO_PLATFORMS.includes(fromHLTB)
    ) {
      return "nintendo"
    } else {
      return "pc"
    }
  }

  switch (value) {
    case "PLAYSTATION":
      return "playstation"
    case "XBOX":
      return "xbox"
    case "NINTENDO":
      return "nintendo"
    case "PC":
      return "pc"
    default:
      return forHTLB()
  }
}

export function uppercaseToNormal(value?: string) {
  if (!value) {
    return value
  }
  return `${value[0]}${value.slice(1).toLowerCase()}`
}

export function nameFirstLiterals(name: string) {
  if (!name) {
    return "U"
  }
  const [firstName, lastName] = name.split(" ")

  if (!lastName) {
    return firstName[0]
  }

  return `${firstName[0]}${lastName[0]}`
}

export function mapStatusToUI(value: GameStatus) {
  switch (value) {
    case "BACKLOG":
      return "Put in backlog"
    case "INPROGRESS":
      return "Start playing"
    case "COMPLETED":
      return "Complete"
    case "ABANDONED":
      return "Abandon"
  }
}

export function prepareDescription(value: string) {
  if (!value) {
    return ""
  }

  let purified = value.slice()
  purified = purified.replace(" ...Read More", "").trim()
  const metaIndex = purified.indexOf("How long is")
  return purified.slice(0, metaIndex)
}

export function hasSelectedPlatformInList(
  platformFromList: string,
  selectedPlatform: string
) {
  return platformFromList.toLowerCase().includes(selectedPlatform.toLowerCase())
}
