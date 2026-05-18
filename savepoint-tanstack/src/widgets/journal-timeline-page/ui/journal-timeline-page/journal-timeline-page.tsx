import { useMemo, useState } from "react";

import { ComposeJournalEntryDialog } from "@/features/compose-journal-entry";
import { DeleteJournalEntryDialog } from "@/features/delete-journal-entry";
import { EditJournalEntryDialog } from "@/features/edit-journal-entry";
import { Button } from "@/shared/ui/button";
import { JournalEntryDetail } from "@/widgets/journal-entry-detail";
import {
  JournalTimeline,
  type JournalTimelineEntry,
} from "@/widgets/journal-timeline";

import type { JournalTimelinePageProps } from "./journal-timeline-page.type";

type DialogKind = "none" | "compose" | "detail" | "edit" | "delete";

/**
 * Widget that wraps `JournalTimeline` and adds CRUD CTAs:
 *
 * - A header "Compose entry" button opens the compose dialog.
 * - Each entry card is itself clickable — opens the entry-detail widget.
 * - The detail widget surfaces Edit + Delete buttons that route to the
 *   respective feature dialogs.
 *
 * FSD: widget layer is the composing layer — it can import features
 * (compose / edit / delete journal entry) and the entity-layer journal-entry
 * UI (via `JournalTimeline`). The route stays thin: it loads data and
 * renders this widget.
 */
export function JournalTimelinePage({ entries }: JournalTimelinePageProps) {
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind>("none");

  const entriesById = useMemo(() => {
    const map = new Map<string, JournalTimelineEntry>();
    for (const entry of entries) map.set(entry.id, entry);
    return map;
  }, [entries]);

  const activeEntry =
    activeEntryId !== null ? (entriesById.get(activeEntryId) ?? null) : null;

  const openCompose = () => {
    setActiveEntryId(null);
    setDialog("compose");
  };

  const openDetail = (entryId: string) => {
    setActiveEntryId(entryId);
    setDialog("detail");
  };

  const openEdit = (entryId: string) => {
    setActiveEntryId(entryId);
    setDialog("edit");
  };

  const openDelete = (entryId: string) => {
    setActiveEntryId(entryId);
    setDialog("delete");
  };

  const closeAll = () => {
    setDialog("none");
  };

  return (
    <>
      <div className="gap-md mb-lg flex items-center justify-between">
        <h1 className="text-h1">Journal</h1>
        <Button type="button" onClick={openCompose}>
          Compose entry
        </Button>
      </div>

      <JournalTimeline entries={entries} onEntrySelect={openDetail} />

      <ComposeJournalEntryDialog
        open={dialog === "compose"}
        onOpenChange={(open) => {
          if (!open) closeAll();
        }}
      />

      {activeEntry && dialog === "detail" ? (
        <JournalEntryDetail
          open={true}
          onOpenChange={(open) => {
            if (!open) closeAll();
          }}
          entry={{
            id: activeEntry.id,
            kind: activeEntry.kind,
            title: activeEntry.title,
            content: activeEntry.content,
            createdAt: activeEntry.createdAt,
            updatedAt: activeEntry.updatedAt,
            gameId: activeEntry.game?.id ?? null,
            game: activeEntry.game
              ? {
                  id: activeEntry.game.id,
                  title: activeEntry.game.title,
                  slug: activeEntry.game.slug,
                }
              : null,
          }}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      ) : null}

      {activeEntry && dialog === "edit" ? (
        <EditJournalEntryDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) closeAll();
          }}
          entry={{
            id: activeEntry.id,
            content: activeEntry.content,
            kind: activeEntry.kind,
            gameId: activeEntry.game?.id ?? null,
          }}
        />
      ) : null}

      {activeEntry && dialog === "delete" ? (
        <DeleteJournalEntryDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) closeAll();
          }}
          entryId={activeEntry.id}
        />
      ) : null}
    </>
  );
}
