import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

export type LibraryStatusBadgeProps = {
  status: LibraryItemStatus;
  /** When `true`, the badge renders nothing (saves a wrapping conditional). */
  hidden?: boolean;
  className?: string;
};
