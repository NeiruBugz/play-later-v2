import type { BadgeProps } from "@/shared/components/ui/badge";
type PlatformBadgeVariant = NonNullable<BadgeProps["variant"]>;
export function getPlatformBadgeVariant(
  platformName: string
): PlatformBadgeVariant {
  const lowerName = platformName.toLowerCase();
  if (lowerName.includes("playstation") || lowerName.includes("ps")) {
    return "playstation";
  }
  if (lowerName.includes("xbox")) {
    return "xbox";
  }
  // Nintendo variants - special handling for platforms without "Nintendo" in the name
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
    return "nintendo";
  }
  if (
    lowerName.includes("pc") ||
    lowerName.includes("windows") ||
    lowerName.includes("mac") ||
    lowerName.includes("linux") ||
    lowerName.includes("steam")
  ) {
    return "pc";
  }
  return "secondary";
}
