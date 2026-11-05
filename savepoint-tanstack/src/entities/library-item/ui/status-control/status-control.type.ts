import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

export type StatusControlProps = {
  status: LibraryItemStatus;
  onChange: (to: LibraryItemStatus) => void;
  disabled?: boolean;
  className?: string;
};
