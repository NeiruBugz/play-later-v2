import { useNavigate } from "@tanstack/react-router";
import { PackagePlus } from "lucide-react";

import { openGlobalAction } from "@/shared/lib/global-action";
import { PageHeader } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

import { DashboardContinueList } from "../dashboard-continue-list";
import { DashboardGameRail } from "../dashboard-game-rail";
import { DashboardJumpBackInHero } from "../dashboard-jump-back-in-hero";
import { DashboardStatsCard } from "../dashboard-stats-card";
import { DashboardStatusStrip } from "../dashboard-status-strip";
import type { DashboardPageProps } from "./dashboard-page.type";
import { buildEyebrowDate, buildGreeting } from "./dashboard-page.utility";

const UP_NEXT_RAIL_LIMIT = 3;

export function DashboardPage({ data }: DashboardPageProps) {
  const total =
    data.statusCounts.WANT + data.statusCounts.PLAYING + data.statusCounts.DONE;

  const mostInProgressGame = data.quickLogGames[0] ?? null;
  const now = new Date();
  const navigate = useNavigate();

  return (
    <main className="container mx-auto px-4 py-4 md:py-6">
      <PageHeader
        eyebrow={buildEyebrowDate(now)}
        title={buildGreeting(now, data.username)}
        actions={
          <Button onClick={() => openGlobalAction(navigate, "add-game")}>
            <PackagePlus aria-hidden="true" />
            Add game
          </Button>
        }
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
                viewAll={{ status: "PLAYING" }}
                viewAllLabel="View All Playing"
                emptyMessage="No games in progress. Start something new!"
              />
            </div>

            <DashboardGameRail
              title="Up Next"
              items={data.upNext.items.slice(0, UP_NEXT_RAIL_LIMIT)}
              viewAll={{ status: "UP_NEXT" }}
              viewAllLabel="See all"
              emptyMessage="Nothing queued yet — put up to 5 games in Up Next."
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
