import {
  getLibrary,
  type LibraryItemWithGame,
} from "@/entities/library-item/api/get-library.server";
import { getLibraryStats } from "@/entities/library-item/api/get-library-stats.server";
import { getProfileById } from "@/entities/profile/api/get-profile.server";
import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";
import { UnauthorizedError } from "@/shared/lib/errors";

const QUICK_LOG_LIMIT = 3;
const CONTINUE_PLAYING_LIMIT = 3;
const UP_NEXT_LIMIT = 4;
const RECENTLY_ADDED_LIMIT = 6;
const STATS_MIN_GAMES = 3;

export type DashboardStatusCounts = Record<LibraryItemStatus, number>;

export type DashboardQuickLogGame = {
  id: string;
  igdbId: number;
  title: string;
  slug: string;
  coverImage: string | null;
};

export type DashboardPageData = {
  /** First-name greeting target. Falls back to "there" when unset. */
  username: string;
  /** All five status counts (zero-filled). */
  statusCounts: DashboardStatusCounts;
  /** True when the user has no library items at all. */
  hasEmptyLibrary: boolean;
  /** True only when the total game count crosses the stats-card threshold. */
  showStats: boolean;
  /** Top-N PLAYING games for the reflection-first quick-log hero. */
  quickLogGames: DashboardQuickLogGame[];
  continuePlaying: {
    items: LibraryItemWithGame[];
    total: number;
  };
  upNext: {
    items: LibraryItemWithGame[];
    total: number;
  };
  recentlyAdded: {
    items: LibraryItemWithGame[];
  };
};

const ZERO_COUNTS: DashboardStatusCounts = {
  WISHLIST: 0,
  SHELF: 0,
  UP_NEXT: 0,
  PLAYING: 0,
  PLAYED: 0,
};

/**
 * Aggregator behind `getDashboardPageDataFn`. Owns its own auth gate so
 * integration tests can drive the unauthorized branch without the Start
 * runtime (foot-gun #8 — worker split).
 *
 * Parallel reads: status counts (single groupBy), three filtered library reads
 * for continue-playing / up-next / recently-added, and the session row for the
 * username. The `quickLogGames` slice piggy-backs on the PLAYING result — no
 * extra round trip.
 *
 * Divergences from canonical (`savepoint-app/.../dashboard/page.tsx`):
 * - No `checkSetupStatus` redirect yet (tanstack lacks setup-profile flow).
 * - `quickLogGames` ordering uses library `updatedAt` only; canonical also
 *   joins on `JournalEntry.startedAt` for true "latest activity". When the
 *   journal-join read exists at entity level, swap in here without changing
 *   the worker's signature.
 */
export async function getDashboardPageDataWorker(
  userId: string | undefined
): Promise<DashboardPageData> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  // Profile is the source of truth for the display name/username. Wrap in a
  // local try so a missing/private-profile edge can't blow up the dashboard;
  // greeting falls back to "there" in that case.
  const [stats, playing, upNext, recent, profile] = await Promise.all([
    getLibraryStats(userId),
    getLibrary(userId, {
      status: "PLAYING",
      sortBy: "updatedAt",
      sortOrder: "desc",
    }),
    getLibrary(userId, {
      status: "UP_NEXT",
      sortBy: "updatedAt",
      sortOrder: "desc",
    }),
    getLibrary(userId, { sortBy: "createdAt", sortOrder: "desc" }),
    getProfileById(userId).catch(() => null),
  ]);

  const statusCounts: DashboardStatusCounts = {
    ...ZERO_COUNTS,
    ...(stats.statusCounts as Partial<DashboardStatusCounts>),
  };

  const total =
    statusCounts.WISHLIST +
    statusCounts.SHELF +
    statusCounts.UP_NEXT +
    statusCounts.PLAYING +
    statusCounts.PLAYED;

  const quickLogGames: DashboardQuickLogGame[] = playing.items
    .slice(0, QUICK_LOG_LIMIT)
    .map((item) => ({
      id: item.game.id,
      igdbId: item.game.igdbId,
      title: item.game.title,
      slug: item.game.slug,
      coverImage: item.game.coverImage,
    }));

  // Email-safe greeting target. Legacy accounts seed `name = email`; we
  // filter that and prefer the user-chosen username before falling back
  // to a generic "there" so the hero copy reads cleanly.
  const safeName =
    profile?.name && !profile.name.includes("@") ? profile.name : null;
  const username = safeName ?? profile?.username ?? "there";

  return {
    username,
    statusCounts,
    hasEmptyLibrary: total === 0,
    showStats: total >= STATS_MIN_GAMES,
    quickLogGames,
    continuePlaying: {
      items: playing.items.slice(0, CONTINUE_PLAYING_LIMIT),
      total: playing.total,
    },
    upNext: {
      items: upNext.items.slice(0, UP_NEXT_LIMIT),
      total: upNext.total,
    },
    recentlyAdded: {
      items: recent.items.slice(0, RECENTLY_ADDED_LIMIT),
    },
  };
}
