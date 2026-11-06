import { useNavigate } from "@tanstack/react-router";
import { PackagePlus } from "lucide-react";

import { openGlobalAction } from "@/shared/lib/global-action";
import { PageHeader } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { UpNextShelf } from "@/widgets/up-next-shelf";

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
    <div className="container mx-auto px-4 py-4 md:py-6">
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

      <div className="mb-4 min-w-0">
        <UpNextShelf items={data.upNextTop3} />
      </div>

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
                    variant: "outline",
                  }
                : { label: "Add a game", onClick: addGame, variant: "outline" }
            }
          />
        )}
      </div>
    </div>
  );
}
