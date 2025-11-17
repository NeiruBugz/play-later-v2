import type { IconType } from "react-icons";
import { BsXbox } from "react-icons/bs";
import {
  SiApple,
  SiLinux,
  SiNintendo,
  SiPlaystation,
  SiSteam,
} from "react-icons/si";
import { TbBrandWindows, TbDeviceGamepad2 } from "react-icons/tb";

export function getPlatformIcon(platformName: string): IconType {
  const lowerName = platformName.toLowerCase();
  if (lowerName.includes("playstation") || /\bps\b/.test(lowerName)) {
    return SiPlaystation;
  }
  if (lowerName.includes("xbox")) {
    return BsXbox;
  }
  const nintendoPlatforms = [
    "switch",
    "wii",
    "gamecube",
    "nintendo 64",
    "n64",
    "super nintendo",
    "snes",
    "nes",
    "game boy",
    "gameboy",
    "3ds",
    "ds",
  ];
  if (
    lowerName.includes("nintendo") ||
    nintendoPlatforms.some((platform) => lowerName.includes(platform))
  ) {
    return SiNintendo;
  }
  if (lowerName.includes("windows")) {
    return TbBrandWindows;
  }
  if (lowerName.includes("mac") || lowerName.includes("macos")) {
    return SiApple;
  }
  if (lowerName.includes("linux")) {
    return SiLinux;
  }
  if (lowerName.includes("steam")) {
    return SiSteam;
  }
  if (/\bpc\b/.test(lowerName)) {
    return TbDeviceGamepad2;
  }
  return TbDeviceGamepad2;
}
