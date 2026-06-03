import { Link } from "@tanstack/react-router";

import { DeleteJournalEntryButton } from "@/features/delete-journal-entry";
import { formatJournalDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";

import type { JournalEntryPageProps } from "./journal-entry-page.type";

/**
 * Full-page journal entry detail (Slice 23 page restore for `/journal/$id`).
 *
 * FSD: widget layer — composes the entity-shaped entry display with the
 * Edit `<Link>` (navigation only) and the delete-journal-entry feature button
 * (owns the mutation + post-delete navigation). The route stays thin: it
 * loads the entry and renders this widget.
 *
 * Mirrors canonical's `JournalEntryDetail` page layout (title row with Edit +
 * Delete affordances, meta line with game link + date, pre-wrapped body)
 * while reusing the tanstack simplified journal model (content + kind + game).
 */
export function JournalEntryPage({ entry }: JournalEntryPageProps) {
  const title = entry.title?.trim() || null;
  const kindLabel = entry.kind === "QUICK" ? "Quick note" : "Reflection";
  const displayTitle =
    title ?? `${kindLabel} from ${formatJournalDate(entry.updatedAt)}`;

  return (
    <article className="space-y-xl mx-auto max-w-prose">
      <p className="text-caption text-primary/70 tracking-widest uppercase">
        {kindLabel}
      </p>

      <div className="gap-md flex items-start justify-between">
        <h1 className="text-h1">{displayTitle}</h1>

        <div className="gap-sm flex shrink-0 items-center">
          <Button asChild size="sm">
            <Link to="/journal/$id/edit" params={{ id: entry.id }}>
              Edit
            </Link>
          </Button>
          <DeleteJournalEntryButton entryId={entry.id} />
        </div>
      </div>

      <p className="text-caption text-muted-foreground">
        {entry.game ? (
          <Link
            to="/games/$slug"
            params={{ slug: entry.game.slug }}
            className="hover:text-foreground transition-colors"
          >
            {entry.game.title}
          </Link>
        ) : null}
        {entry.game ? <span> · </span> : null}
        <time dateTime={new Date(entry.createdAt).toISOString()}>
          {formatJournalDate(entry.createdAt)}
        </time>
      </p>

      <p className="text-body whitespace-pre-wrap">{entry.content}</p>
    </article>
  );
}
