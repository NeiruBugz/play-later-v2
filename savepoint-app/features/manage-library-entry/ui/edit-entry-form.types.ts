import type { LibraryItemDomain } from "@/features/library/types";

export interface EditEntryFormProps {
  item: LibraryItemDomain;
  igdbId: number;
  onSuccess: () => void;
  onCancel: () => void;
}
