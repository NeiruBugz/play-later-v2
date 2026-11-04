import type { ReactNode } from "react";

import type { LibraryAwareSearchItem } from "@/entities/library-item/api/search-library-aware-games.worker";

export interface CommandPaletteProps {
  /**
   * Optional external open-state control. If omitted the component owns its
   * own state and binds ⌘K / Ctrl+K plus the
   * `savepoint:command-palette:open` event.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Slot for the add control on games outside the library; filled by the route. */
  renderAddAction?: (game: { igdbId: number; name: string }) => ReactNode;
}

export interface PaletteResultItem {
  id: number;
  name: string;
  slug: string;
  coverImageId: string | null;
  releaseYear: number | null;
  platforms: string[];
}

export type PaletteSearchResponseItem = LibraryAwareSearchItem;
