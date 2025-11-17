import { UpdateProfileFormState } from "../server-actions/update-profile";
export const statusLabels: Record<string, string> = {
  CURIOUS_ABOUT: "Curious About",
  CURRENTLY_EXPLORING: "Currently Exploring",
  TOOK_A_BREAK: "Took a Break",
  EXPERIENCED: "Experienced",
  WISHLIST: "Wishlist",
  REVISITING: "Revisiting",
};
export const initialFormState: UpdateProfileFormState = {
  status: "idle",
};
