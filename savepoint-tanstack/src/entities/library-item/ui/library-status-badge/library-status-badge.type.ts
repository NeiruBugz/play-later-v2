import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

export type LibraryStatusBadgeProps = {
  status: LibraryItemStatus;
  /**
   * `UP_NEXT` doubles as both first-time queue and replay queue. When the
   * viewer's library entry has been played before, the badge surfaces
   * "Replay" instead of "Up Next". Ignored for any other status.
   */
  hasBeenPlayed?: boolean;
  /** When `true`, the badge renders nothing (saves a wrapping conditional). */
  hidden?: boolean;
  className?: string;
};
