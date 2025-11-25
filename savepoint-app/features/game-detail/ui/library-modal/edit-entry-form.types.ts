import type { LibraryItemDomain } from "@/shared/types";

export interface EditEntryFormProps {
  item: LibraryItemDomain;
  onSuccess: () => void;
  onCancel: () => void;
}
