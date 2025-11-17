import { formatAbsoluteDate } from "@/shared/lib/date";
type GameReleaseDateProps = {
  firstReleaseDate?: number | null;
};

export function GameReleaseDate({ firstReleaseDate }: GameReleaseDateProps) {
  // Format release date (IGDB provides Unix timestamp in seconds)
  const date = firstReleaseDate ? new Date(firstReleaseDate * 1000) : null;
  const releaseDate = date ? formatAbsoluteDate(date) : "N/A";
  return (
    <p className="text-muted-foreground text-sm">
      Release Date:{" "}
      {date ? (
        <time dateTime={date.toISOString()}>{releaseDate}</time>
      ) : (
        releaseDate
      )}
    </p>
  );
}
