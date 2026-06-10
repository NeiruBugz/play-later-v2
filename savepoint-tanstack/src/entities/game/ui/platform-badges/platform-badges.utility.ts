import type { IconType } from "react-icons";
import { BsNintendoSwitch, BsXbox } from "react-icons/bs";
import { SiApple, SiLinux, SiPlaystation, SiSteam } from "react-icons/si";
import { TbBrandWindows, TbDeviceGamepad2 } from "react-icons/tb";

import type { BadgeProps } from "@/shared/ui/badge";

export type PlatformFamily =
  | "playstation"
  | "xbox"
  | "nintendo"
  | "pc"
  | "other";

const isPlaystation = (lowerName: string): boolean =>
  lowerName.includes("playstation") ||
  lowerName.includes("vita") ||
  /\bps\b/.test(lowerName);

const isXbox = (lowerName: string): boolean => lowerName.includes("xbox");

const NINTENDO_SUBSTRINGS = [
  "switch",
  "gamecube",
  "super nintendo",
  "game boy",
  "gameboy",
  "famicom",
  "virtual boy",
  "game & watch",
  "satellaview",
];

// Short, ambiguous tokens (e.g. "nes" matches "geNESis") must match as whole
// words so unrelated platforms like "Sega Genesis" do not classify as nintendo.
const NINTENDO_WORD_TOKENS = [
  "wii",
  "n64",
  "snes",
  "nes",
  "gba",
  "gbc",
  "3ds",
  "ds",
  "64dd",
];

const NINTENDO_WORD_PATTERN = new RegExp(
  `\\b(${NINTENDO_WORD_TOKENS.join("|")})\\b`
);

const isNintendo = (lowerName: string): boolean =>
  lowerName.includes("nintendo") ||
  NINTENDO_SUBSTRINGS.some((keyword) => lowerName.includes(keyword)) ||
  NINTENDO_WORD_PATTERN.test(lowerName);

const MOBILE_KEYWORDS = ["windows phone", "windows mobile", "ios", "android"];

const isMobile = (lowerName: string): boolean =>
  MOBILE_KEYWORDS.some((keyword) => lowerName.includes(keyword));

const isPc = (lowerName: string): boolean =>
  lowerName.includes("windows") ||
  lowerName.includes("mac") ||
  lowerName.includes("macos") ||
  lowerName.includes("linux") ||
  lowerName.includes("steam") ||
  lowerName.includes("dos") ||
  /\bpc\b/.test(lowerName);

// Mirrors savepoint-app `shared/lib/platform/get-platform-icon.tsx` so the
// game-detail platform row renders identical brand glyphs across both apps.
// Keyword cascade is shared with `getPlatformFamily` so a badge's glyph and
// brand color always agree.
export function getPlatformIcon(platformName: string): IconType {
  const lowerName = platformName.toLowerCase();
  if (isPlaystation(lowerName)) {
    return SiPlaystation;
  }
  if (isXbox(lowerName)) {
    return BsXbox;
  }
  if (isNintendo(lowerName)) {
    return BsNintendoSwitch;
  }
  if (isMobile(lowerName)) {
    return TbDeviceGamepad2;
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

// Maps an IGDB platform name to its brand family. The cascade order and
// keywords mirror `getPlatformIcon`; mobile is checked before pc so
// "Windows Phone" classifies as `other`, not pc.
export function getPlatformFamily(platformName: string): PlatformFamily {
  const lowerName = platformName.toLowerCase();
  if (isPlaystation(lowerName)) {
    return "playstation";
  }
  if (isXbox(lowerName)) {
    return "xbox";
  }
  if (isNintendo(lowerName)) {
    return "nintendo";
  }
  if (isMobile(lowerName)) {
    return "other";
  }
  if (isPc(lowerName)) {
    return "pc";
  }
  return "other";
}

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

export function getPlatformBadgeVariant(family: PlatformFamily): BadgeVariant {
  return family === "other" ? "subtle" : family;
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
