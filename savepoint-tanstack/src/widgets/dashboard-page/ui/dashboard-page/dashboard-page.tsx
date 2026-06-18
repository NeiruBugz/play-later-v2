import { PageHeader } from "@/shared/ui";
import { EmptyState } from "@/shared/ui/empty-state";

import { DashboardContinueList } from "../dashboard-continue-list";
import { DashboardGameRail } from "../dashboard-game-rail";
import { DashboardJumpBackInHero } from "../dashboard-jump-back-in-hero";
import { DashboardStatsCard } from "../dashboard-stats-card";
import { DashboardStatusStrip } from "../dashboard-status-strip";
import type { DashboardPageProps } from "./dashboard-page.type";
import { buildEyebrowDate, buildGreeting } from "./dashboard-page.utility";

export function DashboardPage({ data }: DashboardPageProps) {
  const total =
    data.statusCounts.WISHLIST +
    data.statusCounts.SHELF +
    data.statusCounts.UP_NEXT +
    data.statusCounts.PLAYING +
    data.statusCounts.PLAYED;

  const mostInProgressGame = data.quickLogGames[0] ?? null;
  const now = new Date();

  return (
    <main className="container mx-auto px-4 py-4 md:py-6">
      <PageHeader
        eyebrow={buildEyebrowDate(now)}
        title={buildGreeting(now, data.username)}
      />

      <div className="md:grid md:grid-cols-[1.5fr_1fr] md:items-stretch md:gap-6">
        <DashboardJumpBackInHero mostInProgressGame={mostInProgressGame} />

        {!data.hasEmptyLibrary ? (
          <div className="hidden md:block">
            <DashboardContinueList
              items={data.continuePlaying.items.slice(1)}
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
          <DashboardStatusStrip
            statusCounts={data.statusCounts}
            total={total}
          />

          <div className="flex flex-col gap-4">
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
