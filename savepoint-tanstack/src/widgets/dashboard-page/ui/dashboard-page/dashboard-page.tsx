import { useNavigate } from "@tanstack/react-router";
import { PackagePlus } from "lucide-react";

import { openGlobalAction } from "@/shared/lib/global-action";
import { PageHeader } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

import { DashboardGameRail } from "../dashboard-game-rail";
import { DashboardPlayingSection } from "../dashboard-playing-section";
import { DashboardStatusStrip } from "../dashboard-status-strip";
import type { DashboardPageProps } from "./dashboard-page.type";

export function DashboardPage({ data }: DashboardPageProps) {
  const navigate = useNavigate();
  const total = data.counts.WANT + data.counts.PLAYING + data.counts.DONE;
  const hasPlaying = data.playing.length > 0;
  const hasQueue = data.upNextTop3.length > 0;

  function addGame() {
    openGlobalAction(navigate, "add-game");
  }

  return (
    <main className="container mx-auto px-4 py-4 md:py-6">
      <PageHeader
        className="mb-3 md:mb-6"
        title="Home"
        actions={
          <Button onClick={addGame}>
            <PackagePlus aria-hidden="true" />
            Add game
          </Button>
        }
      />

      {total > 0 ? <DashboardStatusStrip counts={data.counts} /> : null}

      <div className="flex flex-col gap-4">
        {hasPlaying ? (
          <DashboardPlayingSection items={data.playing} />
        ) : (
          <EmptyState
            spacing="compact"
            title="Nothing playing right now"
            action={
              hasQueue
                ? {
                    label: "Pick from Up Next",
                    to: "/library",
                    search: { status: "UP_NEXT" },
                  }
                : { label: "Add a game", onClick: addGame }
            }
          />
        )}

        <DashboardGameRail
          title="Up Next"
          items={data.upNextTop3}
          viewAll={{ status: "UP_NEXT" }}
          viewAllLabel="See all"
          emptyMessage="Nothing queued yet — put up to 5 games in Up Next."
        />
      </div>
    </main>
  );
}
