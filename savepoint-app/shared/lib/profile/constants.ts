export const statusLabels: Record<string, string> = {
  WANT_TO_PLAY: "Want to Play",
  OWNED: "Owned",
  PLAYING: "Playing",
  PLAYED: "Played",
};

export const initialFormState: {
  status: "idle" | "success" | "error";
  message?: string;
  submittedUsername?: string;
} = {
  status: "idle",
};
