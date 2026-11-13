import type { ReleaseDatePrecision } from "@/entities/game";

export type AboutPanelProps = {
  summary: string | null;
  developer: string | null;
  releaseDate: Date | null;
  releaseDatePrecision: ReleaseDatePrecision | null;
  timeToCreditsSeconds: number | null;
  timeToCompleteSeconds: number | null;
  themes: string[];
  genres: string[];
};
