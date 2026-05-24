import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

export type LifecycleStripProps = {
  status: LibraryItemStatus;
  createdAt: Date | string;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  className?: string;
  /** Injectable clock for deterministic tests. Defaults to `new Date()`. */
  now?: Date;
};
