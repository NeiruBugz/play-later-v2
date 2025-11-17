import { formatAbsoluteDate } from "@/shared/lib/date";

import type { GameReleaseDateProps } from "./game-release-date.types";

export function GameReleaseDate({ firstReleaseDate }: GameReleaseDateProps) {
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
