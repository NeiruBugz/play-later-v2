import type { ComingSoonCandidate } from "@/entities/game";
import { getLatestSessionDates } from "@/entities/journal-entry/api/get-latest-session-dates.server";
import { getComingSoonCandidates } from "@/entities/library-item/api/get-coming-soon-candidates.server";
import { getLibraryStatusCounts } from "@/entities/library-item/api/get-library-status-counts.server";
import {
  getLibrary,
  type LibraryItemWithGame,
} from "@/entities/library-item/api/get-library.server";
import { toUtcCalendarDay } from "@/shared/lib/date";
import { UnauthorizedError } from "@/shared/lib/errors";

import { orderContinueGames } from "../model/order-continue-games";

export type DashboardStatusCounts = {
  WANT: number;
  PLAYING: number;
  DONE: number;
};

export type ContinueGame = LibraryItemWithGame & {
  lastSessionAt: Date | null;
  becamePlayingAt: Date | null;
};

export type DashboardPageData = {
  playing: ContinueGame[];
  /** The whole Up Next queue (Want or Done, at most UP_NEXT_MAX), in queue order. */
  upNextQueue: LibraryItemWithGame[];
  /** Queue size. */
  upNextTotal: number;
  counts: DashboardStatusCounts;
  comingSoonCandidates: ComingSoonCandidate[];
};

export async function getDashboardPageDataWorker(
  userId: string | undefined
): Promise<DashboardPageData> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const [statusCounts, playing, queued, comingSoonCandidates] =
    await Promise.all([
      getLibraryStatusCounts(userId),
      getLibrary(userId, {
        status: "PLAYING",
        sortBy: "updatedAt",
        sortOrder: "desc",
      }),
      getLibrary(userId, { upNext: true }),
      getComingSoonCandidates(userId, toUtcCalendarDay(new Date())),
    ]);

  const lastSessionDates = await getLatestSessionDates(
    userId,
    playing.items.map((item) => item.gameId)
  );
  const playingWithDates: ContinueGame[] = playing.items.map((item) => ({
    ...item,
    lastSessionAt: lastSessionDates.get(item.gameId) ?? null,
    becamePlayingAt: item.statusChangedAt,
  }));

  return {
    playing: orderContinueGames(playingWithDates),
    upNextQueue: queued.items,
    upNextTotal: queued.total,
    counts: {
      WANT: statusCounts.WANT,
      PLAYING: statusCounts.PLAYING,
      DONE: statusCounts.DONE,
    },
    comingSoonCandidates,
  };
}
