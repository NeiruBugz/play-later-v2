import { Link } from "@tanstack/react-router";

import { PROMPT_QUESTION } from "@/entities/journal-entry";
import { DeleteJournalEntryButton } from "@/features/delete-journal-entry";
import { formatHours, formatJournalDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";

import type { JournalEntryPageProps } from "./journal-entry-page.type";

/**
 * Note view for `/journal/$id`: the note's text, time played and the date it
 * was written, with Edit (navigation only) and the delete-journal-entry
 * feature button (owns the mutation + post-delete navigation).
 *
 * FSD: widget layer. The route stays thin: it loads the note and renders this.
 */
export function JournalEntryPage({ entry }: JournalEntryPageProps) {
  const content = entry.content.trim();
  const timePlayed =
    entry.playedMinutes !== null && entry.playedMinutes > 0
      ? formatHours(entry.playedMinutes)
      : null;

  return (
    <article className="space-y-xl mx-auto max-w-prose">
      <div className="gap-md flex items-start justify-between">
        <h1 className="text-h1">Note</h1>

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

      {entry.prompt ? (
        <h2 className="text-h3">{PROMPT_QUESTION[entry.prompt]}</h2>
      ) : null}

      {timePlayed ? (
        <p className="text-h3 font-mono">{timePlayed} played</p>
      ) : null}

      {content ? (
        <p className="text-body whitespace-pre-wrap">{content}</p>
      ) : null}
    </article>
  );
}
