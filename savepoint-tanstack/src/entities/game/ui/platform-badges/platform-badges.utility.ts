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

// Mirrors savepoint-app `shared/lib/platform/get-platform-icon.tsx` so the
// game-detail platform row renders identical brand glyphs across both apps.
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

// Mirrors savepoint-app `shared/components/platform-badges.tsx`
// `abbreviatePlatformName` so chip labels match the canonical app exactly.
export function abbreviatePlatformName(name: string): string {
  const abbreviations: Record<string, string> = {
    "playstation 5": "PS5",
    "playstation 4": "PS4",
    "playstation 3": "PS3",
    "playstation 2": "PS2",
    playstation: "PS1",
    "playstation vita": "Vita",
    "playstation portable": "PSP",
    "xbox series x|s": "XSX",
    "xbox series": "XSX",
    "xbox one": "XB1",
    "xbox 360": "X360",
    xbox: "Xbox",
    "nintendo switch": "Switch",
    switch: "Switch",
    "wii u": "Wii U",
    wii: "Wii",
    "nintendo gamecube": "GCN",
    gamecube: "GCN",
    "nintendo 64": "N64",
    "super nintendo entertainment system": "SNES",
    "nintendo entertainment system": "NES",
    "game boy advance": "GBA",
    "game boy color": "GBC",
    "game boy": "GB",
    "nintendo 3ds": "3DS",
    "new nintendo 3ds": "N3DS",
    "nintendo ds": "DS",
    "family computer": "FC",
    "family computer disk system": "FDS",
    satellaview: "BS-X",
    "pc (microsoft windows)": "PC",
    "pc windows": "PC",
    windows: "PC",
    mac: "Mac",
    macos: "Mac",
    linux: "Linux",
    "steam deck": "Deck",
    "game & watch": "G&W",
    "64dd": "64DD",
  };

  const lower = name.toLowerCase();
  return abbreviations[lower] || name;
}

export const MAX_VISIBLE_PLATFORMS = 4;
