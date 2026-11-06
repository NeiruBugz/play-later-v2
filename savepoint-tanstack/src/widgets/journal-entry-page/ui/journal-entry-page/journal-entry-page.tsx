import { Link } from "@tanstack/react-router";

import { PROMPT_QUESTION } from "@/entities/journal-entry";
import { DeleteJournalEntryButton } from "@/features/delete-journal-entry";
import { formatHours, formatJournalDate } from "@/shared/lib/date";
import { buttonVariants } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionLabel } from "@/shared/ui/section-label";

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
      <PageHeader
        title="Note"
        className="mb-0"
        actions={
          <>
            <Link
              to="/journal/$id/edit"
              params={{ id: entry.id }}
              className={buttonVariants({ size: "sm" })}
            >
              Edit
            </Link>
            <DeleteJournalEntryButton entryId={entry.id} />
          </>
        }
      />

      <p className="text-xs font-medium text-muted-foreground">
        {entry.game ? (
          <Link
            to="/games/$slug"
            params={{ slug: entry.game.slug }}
            className="-my-3 inline-flex min-h-11 items-center transition-colors hover:text-foreground md:my-0 md:min-h-0"
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
        <SectionLabel>{PROMPT_QUESTION[entry.prompt]}</SectionLabel>
      ) : null}

      {timePlayed ? (
        <SectionLabel as="p">{timePlayed} played</SectionLabel>
      ) : null}

      {content ? (
        <p className="text-base whitespace-pre-wrap">{content}</p>
      ) : null}
    </article>
  );
}
