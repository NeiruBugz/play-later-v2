import type { GameDetailsResponseItem } from "@/shared/api/igdb";

export type Screenshot = NonNullable<
  GameDetailsResponseItem["screenshots"]
>[number];

export type ScreenshotsPanelProps = {
  screenshots: Screenshot[] | undefined;
  gameTitle: string;
};
