import { Link } from "@tanstack/react-router";

import { PROMPT_QUESTION } from "@/entities/journal-entry";
import { DeleteJournalEntryButton } from "@/features/delete-journal-entry";
import { formatHours, formatJournalDate } from "@/shared/lib/date";
import { buttonVariants } from "@/shared/ui/button";

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
    <article className="mx-auto max-w-prose space-y-4">
      <div className="flex items-start justify-between gap-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Note
        </h1>

        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            to="/journal/$id/edit"
            params={{ id: entry.id }}
            className={buttonVariants({ size: "sm" })}
          >
            Edit
          </Link>
          <DeleteJournalEntryButton entryId={entry.id} />
        </div>
      </div>

      <p className="text-muted-foreground text-xs font-medium">
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
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          {PROMPT_QUESTION[entry.prompt]}
        </h2>
      ) : null}

      {timePlayed ? (
        <p className="font-display text-2xl font-semibold tracking-tight">
          {timePlayed} played
        </p>
      ) : null}

      {content ? (
        <p className="text-base whitespace-pre-wrap">{content}</p>
      ) : null}
    </article>
  );
}
