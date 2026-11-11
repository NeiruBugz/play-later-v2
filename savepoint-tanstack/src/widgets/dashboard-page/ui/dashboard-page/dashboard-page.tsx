import { useNavigate } from "@tanstack/react-router";
import { PackagePlus } from "lucide-react";

import { openGlobalAction } from "@/shared/lib/global-action";
import { useIsDesktop } from "@/shared/lib/use-media-query";
import { PageHeader } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { UpNextShelf } from "@/widgets/up-next-shelf";

import { AlsoPlaying } from "../also-playing";
import { ContinuePanel } from "../continue-panel";
import { DashboardCountsLine } from "../dashboard-counts-line";
import type { DashboardPageProps } from "./dashboard-page.type";

export function DashboardPage({ data }: DashboardPageProps) {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const hasPlaying = data.playing.length > 0;
  const hasQueue = data.upNextQueue.length > 0;

  function addGame() {
    openGlobalAction(navigate, "add-game");
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-6">
      {isDesktop ? (
        <PageHeader
          className="mb-6"
          title="Home"
          actions={
            <Button variant="outline" onClick={addGame}>
              <PackagePlus aria-hidden="true" />
              Add game
            </Button>
          }
        />
      ) : null}

      <ContinuePanel playing={data.playing} upNextQueue={data.upNextQueue} />

      <div className="mb-4 min-w-0">
        <UpNextShelf items={data.upNextQueue} />
      </div>

      {hasPlaying ? (
        <AlsoPlaying playing={data.playing} />
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

      <DashboardCountsLine counts={data.counts} />
    </div>
  );
}
