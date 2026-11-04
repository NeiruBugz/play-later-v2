import { Link } from "@tanstack/react-router";

import { formatHours, formatJournalDate } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent } from "@/shared/ui/card";

import { PROMPT_QUESTION } from "../prompt-question";
import type { JournalEntryCardProps } from "./journal-entry-card.type";

/**
 * Display-only note card.
 *
 * Header row: game title (or "No game") on the left, the date the note was
 * written on the right. Body: the note text clamped to 3 lines, or
 * "{time} played" when the note has time but no text. Footer: time played
 * (when the note also has text) and the game link.
 *
 * Entity layer: no mutations. The optional `onSelect` callback lets a
 * composing widget react to clicks (e.g., open the note view) without the
 * entity importing the feature.
 */
export function JournalEntryCard({ entry, onSelect }: JournalEntryCardProps) {
  const content = entry.content.trim();
  const timePlayed =
    entry.playedMinutes !== null && entry.playedMinutes > 0
      ? formatHours(entry.playedMinutes)
      : null;
  const interactive = typeof onSelect === "function";

  const headingId = `journal-entry-${entry.id}-heading`;

  const cardHeading = entry.game?.title ?? "No game";
  const writtenOn = formatJournalDate(entry.createdAt);

  const body = (
    <CardContent className="p-lg gap-sm flex flex-col">
      {/* Header: game title (prominent) + date */}
      <div className="flex items-baseline justify-between gap-2">
        <h3
          id={headingId}
          className="md:font-display text-sm leading-snug font-semibold md:text-base"
        >
          {cardHeading}
        </h3>
        <time
          dateTime={new Date(entry.createdAt).toISOString()}
          className="text-caption text-muted-foreground shrink-0 font-mono tracking-widest uppercase"
        >
          {writtenOn}
        </time>
      </div>

      {entry.prompt ? (
        <h4 className="text-sm font-medium">{PROMPT_QUESTION[entry.prompt]}</h4>
      ) : null}

      {content ? (
        <p className="text-body text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-wrap md:italic">
          <span className="hidden md:inline">&ldquo;</span>
          {content}
          <span className="hidden md:inline">&rdquo;</span>
        </p>
      ) : timePlayed ? (
        <p className="text-body text-muted-foreground leading-relaxed">
          {timePlayed} played
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        {content && timePlayed ? (
          <span className="text-caption text-primary/70 font-mono tracking-widest">
            {timePlayed}
          </span>
        ) : (
          <span />
        )}
        {entry.game ? (
          <Link
            to="/games/$slug"
            params={{ slug: entry.game.slug }}
            className="hover:text-primary text-caption text-muted-foreground inline-flex items-center gap-1 transition-colors"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="font-medium">{entry.game.title}</span>
          </Link>
        ) : null}
      </div>
    </CardContent>
  );

  return (
    <article aria-labelledby={headingId}>
      <Card className="transition-colors">
        {interactive ? (
          <button
            type="button"
            onClick={() => onSelect(entry.id)}
            aria-label={`Open note from ${writtenOn}`}
            className={cn(
              "block w-full cursor-pointer text-left",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
            )}
          >
            {body}
          </button>
        ) : (
          body
        )}
      </Card>
    </article>
  );
}
