import { formatAbsoluteDate } from "@/shared/lib/date";

type GameReleaseDateProps = {
  firstReleaseDate?: number | null;
};

/**
 * Displays the game's release date, or "N/A" if no release date is available.
 *
 * @param firstReleaseDate - Unix timestamp in seconds from IGDB
 * @returns Formatted release date component
 */
export function GameReleaseDate({ firstReleaseDate }: GameReleaseDateProps) {
  // Format release date (IGDB provides Unix timestamp in seconds)
  const releaseDate = firstReleaseDate
    ? formatAbsoluteDate(new Date(firstReleaseDate * 1000))
    : "N/A";

  return (
    <p className="text-muted-foreground text-sm">Release Date: {releaseDate}</p>
  );
}
