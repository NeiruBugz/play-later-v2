import { formatJournalDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import type { JournalEntryDetailProps } from "./journal-entry-detail.type";

/**
 * Widget that surfaces a journal entry's content + Edit/Delete affordances.
 *
 * FSD: lives at the widget layer because it composes shared/ui primitives
 * (Dialog/Button) and serves as the bridge from the entity-layer entry card
 * to the feature-layer Edit/Delete dialogs. The widget itself does NOT
 * import the edit/delete features — it emits `onEdit` / `onDelete`
 * callbacks; the composing layer (`widgets/journal-timeline-page`) owns the
 * dialog routing.
 */
export function JournalEntryDetail({
  open,
  onOpenChange,
  entry,
  onEdit,
  onDelete,
}: JournalEntryDetailProps) {
  const title = entry.title?.trim() || null;
  const kindLabel = entry.kind === "QUICK" ? "Quick note" : "Reflection";
  const displayTitle =
    title ?? `${kindLabel} from ${formatJournalDate(entry.updatedAt)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{displayTitle}</DialogTitle>
          <DialogDescription>
            {kindLabel} · {formatJournalDate(entry.updatedAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="gap-md flex flex-col">
          <p className="text-body text-foreground leading-relaxed whitespace-pre-wrap">
            {entry.content}
          </p>
          {entry.game ? (
            <p className="text-muted-foreground text-sm">
              <span className="font-medium">{entry.game.title}</span>
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onDelete(entry.id)}
          >
            Delete
          </Button>
          <Button type="button" onClick={() => onEdit(entry.id)}>
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
