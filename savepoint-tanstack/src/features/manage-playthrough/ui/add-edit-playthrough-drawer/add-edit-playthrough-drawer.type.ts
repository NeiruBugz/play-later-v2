import type { PlaythroughFormValues } from "@/features/manage-playthrough/model";

export interface AddEditPlaythroughDrawerProps {
  open: boolean;
  mode: "add" | "edit";
  libraryItemId: number;
  existingPlaythroughCount: number;
  playthrough?: PlaythroughFormValues;
  onOpenChange: (open: boolean) => void;
}
