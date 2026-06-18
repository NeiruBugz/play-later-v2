import { Link, useNavigate } from "@tanstack/react-router";

import { PageHeader } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { JournalTimeline } from "@/widgets/journal-timeline";

import { JournalStatsRail } from "../journal-stats-rail";
import type { JournalTimelinePageProps } from "./journal-timeline-page.type";

/**
 * Widget that wraps `JournalTimeline` and adds CRUD navigation:
 *
 * - A header "Compose entry" link navigates to `/journal/new`.
 * - Each entry card is clickable — navigates to `/journal/$id`.
 * - On desktop, pairs the timeline with a `JournalStatsRail` (AC JRN-4).
 *
 * Slice 23 (blocker remediation #1): this widget previously owned compose /
 * detail / edit / delete *dialogs*. The product decision reversed that
 * dialog-only pivot in favor of full page routes for URL + UX parity, so the
 * timeline now navigates to the dedicated pages instead. The compose/edit/
 * delete dialog components are unchanged and still used by the game-detail,
 * library-item-card, and dashboard quick-compose surfaces.
 *
 * Layout: both the timeline column and the stats rail are always in the DOM
 * (SSR-safe). Below `md` the grid collapses to a single column and the rail
 * is hidden via `hidden md:block`; above `md` the two-column layout is applied
 * via responsive Tailwind classes — no post-hydration layout swap.
 *
 * FSD: widget layer — composes shared/ui + the entity-backed `JournalTimeline`
 * widget. The route stays thin: it loads data and renders this widget.
 */
export function JournalTimelinePage({ entries }: JournalTimelinePageProps) {
  const navigate = useNavigate();

  const openDetail = (entryId: string) => {
    void navigate({ to: "/journal/$id", params: { id: entryId } });
  };

  const entryCount = entries.length;
  const entryWord = entryCount === 1 ? "entry" : "entries";
  const subtitle = `Reflect, don't review. ${entryCount} ${entryWord} across your library.`;

  return (
    <div className="md:grid md:grid-cols-[1fr_280px] md:items-start md:gap-8">
      <div>
        <PageHeader
          eyebrow="// JOURNAL"
          title="Journal"
          sub={subtitle}
          actions={
            <Button asChild>
              <Link to="/journal/new">Compose entry</Link>
            </Button>
          }
        />

        <JournalTimeline entries={entries} onEntrySelect={openDetail} />
      </div>

      <div className="hidden md:block">
        <JournalStatsRail entries={entries} />
      </div>
    </div>
  );
}
