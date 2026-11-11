export type AboutPanelProps = {
  summary: string | null;
  developer: string | null;
  releaseDate: Date | null;
  timeToCreditsSeconds: number | null;
  timeToCompleteSeconds: number | null;
  themes: string[];
  genres: string[];
};
