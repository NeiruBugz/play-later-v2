export const statusLabels: Record<string, string> = {
  WISHLIST: "Wishlist",
  SHELF: "Shelf",
  UP_NEXT: "Up Next",
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
