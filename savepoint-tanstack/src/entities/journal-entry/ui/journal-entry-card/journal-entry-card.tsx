import { Link } from "@tanstack/react-router";

import { formatJournalDate } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent } from "@/shared/ui/card";

import type { JournalEntryCardProps } from "./journal-entry-card.type";

/**
 * Display-only journal entry card — timeline design.
 *
 * Header row: game title (prominent heading) on the left, formatted date on
 * the right. Body: entry content clamped to 3 lines. Footer: kind badge so
 * the entry type is still scannable without dominating the card.
 *
 * Entity layer: no mutations. The optional `onSelect` callback lets a
 * composing widget react to clicks (e.g., open a detail dialog) without the
 * entity importing the feature.
 */
// TODO(021-S16): include playedMinutes/mood/tags when CRUD lands.
export function JournalEntryCard({ entry, onSelect }: JournalEntryCardProps) {
  const content = entry.content.trim();
  const kindLabel = entry.kind === "QUICK" ? "Quick note" : "Reflection";
  const interactive = typeof onSelect === "function";

  const headingId = `journal-entry-${entry.id}-heading`;

  const cardHeading = entry.game?.title ?? entry.title ?? kindLabel;

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
          dateTime={new Date(entry.updatedAt).toISOString()}
          className="text-caption text-muted-foreground shrink-0 font-mono tracking-widest uppercase"
        >
          {formatJournalDate(entry.updatedAt)}
        </time>
      </div>

      {/* Body: 3-line clamp; italic with curly quotes on desktop */}
      <p className="text-body text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-wrap md:italic">
        <span className="hidden md:inline">&ldquo;</span>
        {content}
        <span className="hidden md:inline">&rdquo;</span>
      </p>

      {/* Footer: kind badge + game link (when game present) */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption text-primary/70 tracking-widest uppercase">
          {kindLabel}
        </span>
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
            aria-label={`Open journal entry from ${formatJournalDate(entry.updatedAt)}`}
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
