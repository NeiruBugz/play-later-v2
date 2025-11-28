export const statusLabels: Record<string, string> = {
  CURIOUS_ABOUT: "Curious About",
  CURRENTLY_EXPLORING: "Currently Exploring",
  TOOK_A_BREAK: "Took a Break",
  EXPERIENCED: "Experienced",
  WISHLIST: "Wishlist",
  REVISITING: "Revisiting",
};

export const initialFormState: {
  status: "idle" | "success" | "error";
  message?: string;
  submittedUsername?: string;
} = {
  status: "idle",
};
