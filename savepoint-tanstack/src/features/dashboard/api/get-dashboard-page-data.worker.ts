import { getLibraryStatusCounts } from "@/entities/library-item/api/get-library-status-counts.server";
import {
  getLibrary,
  type LibraryItemWithGame,
} from "@/entities/library-item/api/get-library.server";
import { UnauthorizedError } from "@/shared/lib/errors";

const UP_NEXT_TOP_LIMIT = 3;

export type DashboardStatusCounts = {
  WANT: number;
  PLAYING: number;
  DONE: number;
};

export type DashboardPageData = {
  /** Every PLAYING game, most recently updated first. */
  playing: LibraryItemWithGame[];
  /** Top of the Up Next queue (Want or Done), in queue order. */
  upNextTop3: LibraryItemWithGame[];
  /** Full queue size, for "see all". */
  upNextTotal: number;
  counts: DashboardStatusCounts;
};

export async function getDashboardPageDataWorker(
  userId: string | undefined
): Promise<DashboardPageData> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const [statusCounts, playing, queued] = await Promise.all([
    getLibraryStatusCounts(userId),
    getLibrary(userId, {
      status: "PLAYING",
      sortBy: "updatedAt",
      sortOrder: "desc",
    }),
    getLibrary(userId, { upNext: true }),
  ]);

  return {
    playing: playing.items,
    upNextTop3: queued.items.slice(0, UP_NEXT_TOP_LIMIT),
    upNextTotal: queued.total,
    counts: {
      WANT: statusCounts.WANT,
      PLAYING: statusCounts.PLAYING,
      DONE: statusCounts.DONE,
    },
  };
}
