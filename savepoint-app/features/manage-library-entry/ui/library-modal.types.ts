import type { LibraryItemDomain } from "@/features/library/types";

export interface LibraryModalProps {
  gameId?: string;
  isOpen: boolean;
  onClose: () => void;
  igdbId: number;
  gameTitle: string;
  mode: "add" | "edit";
  existingItems?: LibraryItemDomain[];
  onDeleteItem?: (itemId: number) => void;
}
