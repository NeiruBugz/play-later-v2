import type { SearchResponseItem } from "@/shared/api/igdb";

export interface CommandPaletteProps {
  /**
   * Optional external open-state control. If omitted the component owns its
   * own state and binds ⌘K / Ctrl+K plus the
   * `savepoint:command-palette:open` event.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface PaletteResultItem {
  id: number;
  name: string;
  slug: string;
  coverImageId: string | null;
  releaseYear: number | null;
  platforms: string[];
}

export type PaletteSearchResponseItem = SearchResponseItem;
