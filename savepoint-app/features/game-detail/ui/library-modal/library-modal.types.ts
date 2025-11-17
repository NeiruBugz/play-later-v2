import type { LibraryItem } from "@prisma/client";

export interface LibraryModalProps {
  gameId?: string;
  isOpen: boolean;
  onClose: () => void;
  igdbId: number;
  gameTitle: string;
  mode: "add" | "edit";
  existingItems?: LibraryItem[];
  onDeleteItem?: (itemId: number) => void;
}
