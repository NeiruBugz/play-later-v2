import { GameScreenshots } from "@/src/widgets/game-screenshots";
import { Suspense } from "react";

export function IgdbInfo({
  igdbId,
  gameName,
}: {
  igdbId: number | undefined | null;
  gameName: string;
}): JSX.Element {
  return (
    <div>
      <Suspense fallback="Loading...">
        <GameScreenshots gameId={igdbId} gameName={gameName} />
      </Suspense>
    </div>
  );
}
