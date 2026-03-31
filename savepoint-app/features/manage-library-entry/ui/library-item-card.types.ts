import type { LibraryItemDomain } from "@/features/library/types";

export interface LibraryItemCardProps {
  item: LibraryItemDomain;
  onClick?: () => void;
  onDelete?: (itemId: number) => void;
}
