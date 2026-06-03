export type Screenshot = {
  id: number;
  image_id: string;
};

export type ScreenshotsPanelProps = {
  screenshots: Screenshot[] | undefined;
  gameTitle: string;
};
