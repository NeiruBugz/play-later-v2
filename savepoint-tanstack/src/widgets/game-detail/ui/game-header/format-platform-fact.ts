import { abbreviatePlatformName } from "@/entities/game";

const PLATFORM_SEPARATOR = " · ";

export function formatPlatformFact(
  names: string[],
  limit: number
): string | null {
  if (names.length === 0) {
    return null;
  }
  const shown = names.slice(0, limit).map(abbreviatePlatformName);
  const hiddenCount = names.length - shown.length;
  const joined = shown.join(PLATFORM_SEPARATOR);
  return hiddenCount > 0 ? `${joined} +${hiddenCount}` : joined;
}
