import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

export type GameDetailActionBarProps = {
  gameSlug: string;
  gameStatus: LibraryItemStatus | null;
  viewerUserId: string | null;
  onStatusClick?: () => void;
};
