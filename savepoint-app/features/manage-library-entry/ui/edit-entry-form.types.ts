import type { LibraryItemDomain } from "@/features/library/types";

export interface EditEntryFormProps {
  item: LibraryItemDomain;
  onSuccess: () => void;
  onCancel: () => void;
}
