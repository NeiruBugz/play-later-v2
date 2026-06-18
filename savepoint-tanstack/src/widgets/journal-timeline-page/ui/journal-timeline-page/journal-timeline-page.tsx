import { Link, useNavigate } from "@tanstack/react-router";

import { useIsDesktop } from "@/shared/lib/use-media-query";
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
 * FSD: widget layer — composes shared/ui + the entity-backed `JournalTimeline`
 * widget. The route stays thin: it loads data and renders this widget.
 */
export function JournalTimelinePage({ entries }: JournalTimelinePageProps) {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const openDetail = (entryId: string) => {
    void navigate({ to: "/journal/$id", params: { id: entryId } });
  };

  const entryCount = entries.length;
  const entryWord = entryCount === 1 ? "entry" : "entries";
  const subtitle = `Reflect, don't review. ${entryCount} ${entryWord} across your library.`;

  const timeline = (
    <>
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
    </>
  );

  if (!isDesktop) {
    return timeline;
  }

  return (
    <div className="gap-xl grid grid-cols-[1fr_280px] items-start">
      <div>{timeline}</div>
      <JournalStatsRail entries={entries} />
    </div>
  );
}
