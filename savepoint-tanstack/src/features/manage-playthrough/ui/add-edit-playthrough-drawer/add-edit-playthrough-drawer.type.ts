import type { PlaythroughFormValues } from "@/features/manage-playthrough/model";

export interface AddEditPlaythroughDrawerProps {
  open: boolean;
  mode: "add" | "edit";
  libraryItemId: number;
  existingPlaythroughCount: number;
  /** Required when mode === "edit" — the id of the run being edited. */
  playthroughId?: string;
  playthrough?: PlaythroughFormValues;
  onOpenChange: (open: boolean) => void;
}
