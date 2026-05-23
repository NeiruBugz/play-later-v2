import { Link, useNavigate } from "@tanstack/react-router";

import { Button } from "@/shared/ui/button";
import { JournalTimeline } from "@/widgets/journal-timeline";

import type { JournalTimelinePageProps } from "./journal-timeline-page.type";

/**
 * Widget that wraps `JournalTimeline` and adds CRUD navigation:
 *
 * - A header "Compose entry" link navigates to `/journal/new`.
 * - Each entry card is clickable — navigates to `/journal/$id`.
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

  const openDetail = (entryId: string) => {
    void navigate({ to: "/journal/$id", params: { id: entryId } });
  };

  return (
    <>
      <div className="gap-md mb-lg flex items-center justify-between">
        <h1 className="text-h1">Journal</h1>
        <Button asChild>
          <Link to="/journal/new">Compose entry</Link>
        </Button>
      </div>

      <JournalTimeline entries={entries} onEntrySelect={openDetail} />
    </>
  );
}
