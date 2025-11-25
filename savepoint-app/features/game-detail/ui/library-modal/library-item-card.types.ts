import type { LibraryItemDomain } from "@/shared/types";

export interface LibraryItemCardProps {
  item: LibraryItemDomain;
  onClick?: () => void;
  onDelete?: (itemId: number) => void;
}
