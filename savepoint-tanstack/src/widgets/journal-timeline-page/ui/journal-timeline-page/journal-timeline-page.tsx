import { useNavigate } from "@tanstack/react-router";

import { JournalGameFilter } from "@/features/journal-timeline/ui/journal-game-filter";
import { openGlobalAction } from "@/shared/lib/global-action";
import { PageHeader } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { JournalTimeline } from "@/widgets/journal-timeline";

import { JournalStatsRail } from "../journal-stats-rail";
import type { JournalTimelinePageProps } from "./journal-timeline-page.type";

/**
 * Widget that wraps `JournalTimeline` and adds navigation:
 *
 * - "New note" opens the Log form (`?action=log-session`).
 * - The game filter writes `gameId` to the route search: a game id, `none`
 *   (notes without a game) or nothing (all notes).
 * - Each note card opens its note view at `/journal/$id`.
 * - On desktop, pairs the timeline with a `JournalStatsRail`.
 *
 * Layout: both the timeline column and the stats rail are always in the DOM
 * (SSR-safe); below `md` the rail is hidden via `hidden md:block`.
 */
export function JournalTimelinePage({
  entries,
  gameOptions,
  selectedGame,
}: JournalTimelinePageProps) {
  const navigate = useNavigate();

  const openDetail = (entryId: string) => {
    void navigate({ to: "/journal/$id", params: { id: entryId } });
  };

  const selectGame = (gameId: string | undefined) => {
    void navigate({ to: ".", search: (prev) => ({ ...prev, gameId }) });
  };

  const noteCount = entries.length;
  const subtitle = `${noteCount} ${noteCount === 1 ? "note" : "notes"}`;

  return (
    <div className="md:grid md:grid-cols-[1fr_280px] md:items-start md:gap-8">
      <div>
        <PageHeader
          title="Journal"
          sub={subtitle}
          actions={
            <Button onClick={() => openGlobalAction(navigate, "log-session")}>
              New note
            </Button>
          }
        />

        <div className="mb-3">
          <JournalGameFilter
            options={gameOptions}
            value={selectedGame}
            onChange={selectGame}
          />
        </div>

        <JournalTimeline entries={entries} onEntrySelect={openDetail} />
      </div>

      <div className="hidden md:block">
        <JournalStatsRail />
      </div>
    </div>
  );
}
