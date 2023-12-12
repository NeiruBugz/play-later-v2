import { Game, GameStatus } from "@prisma/client"
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
  console.log(value)
  if (!value) {
    return ""
  }

  if (value === "FULL_COMPLETION") {
    return "100% Complete"
  }

  return uppercaseToNormal(value)
}

export function uppercaseToNormal(value?: string) {
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
