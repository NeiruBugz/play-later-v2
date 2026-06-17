import { EmptyState } from "@/shared/ui/empty-state";

import { DashboardGameRail } from "../dashboard-game-rail";
import { DashboardJumpBackInHero } from "../dashboard-jump-back-in-hero";
import { DashboardStatsCard } from "../dashboard-stats-card";
import { DashboardStatusStrip } from "../dashboard-status-strip";
import type { DashboardPageProps } from "./dashboard-page.type";

export function DashboardPage({ data }: DashboardPageProps) {
  const total =
    data.statusCounts.WISHLIST +
    data.statusCounts.SHELF +
    data.statusCounts.UP_NEXT +
    data.statusCounts.PLAYING +
    data.statusCounts.PLAYED;

  // The hero card features the single most in-progress game.
  const mostInProgressGame = data.quickLogGames[0] ?? null;

  return (
    <main className="container mx-auto px-4 py-4 md:py-6">
      {/*
       * AC DASH-1: "Jump back in" hero always leads — above stats and rails.
       * AC DASH-4 desktop: hero + continue rail side by side via a grid.
       */}
      <div className="md:grid md:grid-cols-[1fr_360px] md:gap-6">
        <DashboardJumpBackInHero
          username={data.username}
          mostInProgressGame={mostInProgressGame}
        />

        {/* Desktop-only: Continue Playing rail shown beside the hero. */}
        {!data.hasEmptyLibrary ? (
          <div className="hidden md:block">
            <DashboardGameRail
              title="Playing"
              items={data.continuePlaying.items}
              totalCount={data.continuePlaying.total}
              viewAll={{ status: "PLAYING" }}
              viewAllLabel="View All Playing"
              emptyMessage="No games in progress."
            />
          </div>
        ) : null}
      </div>

      {/* TODO(slice-B): port `GettingStartedChecklist` from canonical
          `features/onboarding`. Until then, this slot is intentionally empty. */}

      {data.hasEmptyLibrary ? (
        <EmptyLibraryFallback />
      ) : (
        <>
          {/*
           * AC DASH-3: status counts as a single compact horizontal strip.
           * Only shown when there are games to summarize.
           */}
          <DashboardStatusStrip
            statusCounts={data.statusCounts}
            total={total}
          />

          {/*
           * Game rails — scroll-snap carousels on mobile, multi-column grids
           * on desktop (AC DASH-2 + AC DASH-4). The Playing rail is already
           * shown beside the hero on desktop, so it's mobile-only here.
           */}
          <div className="flex flex-col gap-4">
            {/* Playing rail: mobile only (desktop version lives in the hero grid column) */}
            <div className="md:hidden">
              <DashboardGameRail
                title="Playing"
                items={data.continuePlaying.items}
                totalCount={data.continuePlaying.total}
                viewAll={{ status: "PLAYING" }}
                viewAllLabel="View All Playing"
                emptyMessage="No games in progress. Start something new!"
              />
            </div>

            <DashboardGameRail
              title="Up next"
              items={data.upNext.items}
              totalCount={data.upNext.total}
              viewAll={{ status: "UP_NEXT" }}
              viewAllLabel="View All Up Next"
              emptyMessage="No games queued up"
            />

            <DashboardGameRail
              title="Recently played"
              items={data.recentlyAdded.items}
              viewAll={{ sortBy: "createdAt", sortOrder: "desc" }}
              viewAllLabel="View Library"
              emptyMessage="Your library is empty. Add some games to get started!"
            />
          </div>

          {/* Desktop: library-breakdown card (stats). */}
          {data.showStats ? (
            <div className="mt-4">
              <DashboardStatsCard
                statusCounts={data.statusCounts}
                total={total}
              />
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}

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
