import { IgdbImage } from "@/shared/components/igdb-image";
import igdbApi from "@/shared/lib/igdb";
import { use } from "react";
import { ScreenshotCarousel } from "./screenshot-carousel";

export function GameScreenshots({
  gameId,
  gameName,
}: {
  gameId: number | null | undefined;
  gameName: string;
}) {
  const { screenshots } = use(igdbApi.getGameScreenshots(gameId));

  return <ScreenshotCarousel screenshots={screenshots} gameName={gameName} />;
}
