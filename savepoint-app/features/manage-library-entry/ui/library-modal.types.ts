import type { LibraryItemDomain } from "@/shared/types";

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
