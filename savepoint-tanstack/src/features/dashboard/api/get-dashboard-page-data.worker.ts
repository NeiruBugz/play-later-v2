import { getLibraryStatusCounts } from "@/entities/library-item/api/get-library-status-counts.server";
import {
  getLibrary,
  type LibraryItemWithGame,
} from "@/entities/library-item/api/get-library.server";
import { UnauthorizedError } from "@/shared/lib/errors";

export type DashboardStatusCounts = {
  WANT: number;
  PLAYING: number;
  DONE: number;
};

export type DashboardPageData = {
  /** Every PLAYING game, most recently updated first. */
  playing: LibraryItemWithGame[];
  /** The whole Up Next queue (Want or Done, at most UP_NEXT_MAX), in queue order. */
  upNextQueue: LibraryItemWithGame[];
  /** Queue size. */
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
    upNextQueue: queued.items,
    upNextTotal: queued.total,
    counts: {
      WANT: statusCounts.WANT,
      PLAYING: statusCounts.PLAYING,
      DONE: statusCounts.DONE,
    },
  };
}
