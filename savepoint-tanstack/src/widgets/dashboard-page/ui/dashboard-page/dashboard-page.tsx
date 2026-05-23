import { EmptyState } from "@/shared/ui/empty-state";

import { DashboardGameSection } from "../dashboard-game-section";
import { DashboardQuickLogHero } from "../dashboard-quick-log-hero";
import { DashboardStatsCard } from "../dashboard-stats-card";
import type { DashboardPageProps } from "./dashboard-page.type";

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
    <EmptyState
      className="mt-2"
      title="Your library is empty"
      description="Add a game to start tracking what you're playing, what's up next, and what you'd like to revisit."
      action={{ label: "Browse Library", to: "/library" }}
    />
  );
}
