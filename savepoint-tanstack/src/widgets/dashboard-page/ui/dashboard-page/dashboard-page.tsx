import { Link } from "@tanstack/react-router";

import { Button } from "@/shared/ui/button";

import { DashboardGameSection } from "../dashboard-game-section";
import { DashboardQuickLogHero } from "../dashboard-quick-log-hero";
import { DashboardStatsCard } from "../dashboard-stats-card";

import type { DashboardPageProps } from "./dashboard-page.type";

/**
 * Dashboard page composition. Mirrors canonical's two-mode shape:
 *
 *   1. Quick-log hero (always — top of the page)
 *   2. Getting-started checklist (TODO: pending `onboarding` feature port)
 *   3. EITHER the empty-library hero
 *      OR the 2-column main grid (stats + activity / continue + up-next)
 *      plus the Recently Added strip below
 *
 * Slots not yet ported:
 *   - `GettingStartedChecklist` (onboarding feature — Slice B)
 *   - `EmptyLibraryHero` (onboarding feature — Slice B)
 *   - `ActivityFeed` (social feature — Slice C)
 *
 * Until those features land, the corresponding sections render minimal
 * inline empty-state copy so the layout still makes sense in production.
 */
export function DashboardPage({ data }: DashboardPageProps) {
  const total =
    data.statusCounts.WISHLIST +
    data.statusCounts.SHELF +
    data.statusCounts.UP_NEXT +
    data.statusCounts.PLAYING +
    data.statusCounts.PLAYED;

  return (
    <main className="container mx-auto px-4 py-6">
      <DashboardQuickLogHero
        username={data.username}
        playingGames={data.quickLogGames}
      />

      {/* TODO(slice-B): port `GettingStartedChecklist` from canonical
          `features/onboarding`. Until then, this slot is intentionally empty
          to keep the page from drifting toward a phantom "Empty" feel. */}

      {data.hasEmptyLibrary ? (
        <EmptyLibraryFallback />
      ) : (
        <>
          <div className="grid gap-2 lg:grid-cols-[1fr_1fr]">
            <div className="flex flex-col gap-2">
              {data.showStats ? (
                <DashboardStatsCard
                  statusCounts={data.statusCounts}
                  total={total}
                />
              ) : null}

              {/* TODO(slice-C): port `ActivityFeed` from canonical
                  `features/social`. Until then, this slot is intentionally
                  empty. */}
            </div>

            <div className="flex flex-col gap-2">
              <DashboardGameSection
                title="Playing"
                items={data.continuePlaying.items}
                totalCount={data.continuePlaying.total}
                viewAll={{ status: "PLAYING" }}
                viewAllLabel="View All Playing"
                emptyMessage="No games in progress. Start exploring something new!"
                variant="hero"
              />

              <DashboardGameSection
                title="Up Next"
                items={data.upNext.items}
                totalCount={data.upNext.total}
                viewAll={{ status: "UP_NEXT" }}
                viewAllLabel="View All Up Next"
                emptyMessage="No games queued up"
              />
            </div>
          </div>

          <div className="mt-2">
            <DashboardGameSection
              title="Recently Added"
              items={data.recentlyAdded.items}
              viewAll={{ sortBy: "createdAt", sortOrder: "desc" }}
              viewAllLabel="View Library"
              emptyMessage="Your library is empty. Add some games to get started!"
            />
          </div>
        </>
      )}
    </main>
  );
}

/**
 * Placeholder for canonical's `EmptyLibraryHero` (lives in the `onboarding`
 * feature, not ported yet). Keeps the empty-state surface meaningful until
 * Slice B replaces this with the real widget.
 */
function EmptyLibraryFallback() {
  return (
    <section className="border-border bg-card/40 mt-2 rounded-lg border border-dashed p-12 text-center">
      <h2 className="text-xl font-semibold tracking-tight">
        Your library is empty
      </h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
        Add a game to start tracking what you&apos;re playing, what&apos;s up
        next, and what you&apos;d like to revisit.
      </p>
      <div className="mt-4">
        <Button asChild>
          <Link to="/library">Browse Library</Link>
        </Button>
      </div>
    </section>
  );
}
