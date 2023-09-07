import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function platformEnumToColor(value: string) {
  switch (value) {
    case "PLAYSTATION" || value.toLowerCase().includes("playstation"):
      return "playstation"
    case "XBOX" || value.toLowerCase().includes("xbox"):
      return "xbox"
    case "NINTENDO" || value.toLowerCase().includes("nintendo"):
      return "nintendo"
    default:
      return "pc"
  }
}

export function platformToUI(value?: string) {
  if (!value) {
    return value
  }
  return `${value[0]}${value.slice(1).toLowerCase()}`
}
