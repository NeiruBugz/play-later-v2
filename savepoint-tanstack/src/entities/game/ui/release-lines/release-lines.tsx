import { useDeviceToday } from "@/shared/lib/hooks/use-device-today";

import {
  formatReleaseLabel,
  isUpcomingRelease,
  shouldShowMovedLine,
} from "../../model";
import type { ReleaseLinesProps } from "./release-lines.type";

const RELEASE_LINE_CLASS_NAME =
  "text-base leading-6 text-muted-foreground md:text-xs md:leading-4";

export function ReleaseLines({ game }: ReleaseLinesProps) {
  const today = useDeviceToday();
  const { releaseDateMovedFrom } = game;

  const upcomingLabel = isUpcomingRelease(game, today)
    ? formatReleaseLabel(game, { today })
    : null;
  const releaseText =
    upcomingLabel === null || game.releaseDatePrecision === "TBA"
      ? upcomingLabel
      : `Out ${upcomingLabel}`;

  const movedFromLabel =
    releaseDateMovedFrom && shouldShowMovedLine(game, today)
      ? formatReleaseLabel(
          { releaseDate: releaseDateMovedFrom, releaseDatePrecision: "DAY" },
          { today }
        )
      : null;

  return (
    <>
      {releaseText === null ? null : (
        <p data-testid="game-card-release" className={RELEASE_LINE_CLASS_NAME}>
          {releaseText}
        </p>
      )}
      {movedFromLabel === null ? null : (
        <p data-testid="game-card-moved" className={RELEASE_LINE_CLASS_NAME}>
          Moved from {movedFromLabel}
        </p>
      )}
    </>
  );
}
