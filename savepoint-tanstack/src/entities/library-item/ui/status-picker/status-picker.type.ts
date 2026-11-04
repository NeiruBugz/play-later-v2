import type { ReactNode } from "react";

import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

export type StatusPickerProps = {
  value: LibraryItemStatus | null;
  onSelect: (to: LibraryItemStatus) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A single focusable element (button); rendered via `asChild`. */
  trigger: ReactNode;
};
