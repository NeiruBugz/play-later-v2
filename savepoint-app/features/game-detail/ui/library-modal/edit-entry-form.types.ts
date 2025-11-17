import type { LibraryItem } from "@prisma/client";

export interface EditEntryFormProps {
  item: LibraryItem;
  onSuccess: () => void;
  onCancel: () => void;
}
