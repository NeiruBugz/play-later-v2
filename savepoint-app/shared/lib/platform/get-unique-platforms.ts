import { type Game, type Platform, type ReleaseDate } from "igdb-api-types";

const isReleaseDate = (value: number | ReleaseDate): value is ReleaseDate =>
  typeof value === "object";
const isPlatform = (value: number | Platform): value is Platform =>
  typeof value === "object";
export function getUniquePlatforms(
  releaseDates: Game["release_dates"] | undefined
): string[] {
  if (!releaseDates || releaseDates.length === 0) {
    return [];
  }
  const platformNames: string[] = [];
  for (const releaseDate of releaseDates) {
    if (!isReleaseDate(releaseDate)) {
      continue;
    }
    const { platform } = releaseDate;
    if (platform === undefined || !isPlatform(platform)) {
      continue;
    }
    const { name } = platform;
    if (typeof name === "string" && name !== "") {
      platformNames.push(name);
    }
  }
  return [...new Set(platformNames)].sort((a, b) => a.localeCompare(b));
}
