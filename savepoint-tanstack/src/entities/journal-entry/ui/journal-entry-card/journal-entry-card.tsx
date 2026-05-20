import { Link } from "@tanstack/react-router";

import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardDescription } from "@/shared/ui/card";

import type { JournalEntryCardProps } from "./journal-entry-card.type";

function formatEntryDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

/**
 * Display-only journal entry card. Renders the entry's content, kind badge,
 * timestamp, and a link to the associated game when present.
 *
 * Entity layer: no mutations. The optional `onSelect` callback lets a
 * composing widget react to clicks (e.g., open a detail dialog) without the
 * entity importing the feature.
 */
// TODO(021-S16): include playedMinutes/mood/tags when CRUD lands.
export function JournalEntryCard({ entry, onSelect }: JournalEntryCardProps) {
  const title = entry.title?.trim() || null;
  const content = entry.content.trim();
  const kindLabel = entry.kind === "QUICK" ? "Quick note" : "Reflection";
  const interactive = typeof onSelect === "function";

  const body = (
    <CardContent className="p-lg gap-md flex flex-col">
      <header className="gap-xs flex flex-col">
        {/* CardDescription holds the entry meta sub-line (kind label + date),
            matching canonical's typographic hierarchy: title + description. */}
        <CardDescription className="flex items-center justify-between gap-2 !text-xs">
          <span className="text-caption text-primary/70 tracking-widest uppercase">
            {kindLabel}
          </span>
          <time
            dateTime={new Date(entry.updatedAt).toISOString()}
            className="text-muted-foreground font-mono text-xs"
          >
            {formatEntryDate(entry.updatedAt)}
          </time>
        </CardDescription>
        {title ? (
          <h3
            id={`journal-entry-${entry.id}-heading`}
            className="text-base leading-snug font-semibold"
          >
            {title}
          </h3>
        ) : (
          <h3 id={`journal-entry-${entry.id}-heading`} className="sr-only">
            {kindLabel} from {formatEntryDate(entry.updatedAt)}
          </h3>
        )}
      </header>

      <p className="text-body text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-wrap">
        {content}
      </p>

      {entry.game ? (
        <Link
          to="/games/$slug"
          params={{ slug: entry.game.slug }}
          className="hover:text-primary text-caption text-muted-foreground inline-flex items-center gap-2 self-start transition-colors"
          // Stop the click from bubbling up to the surrounding interactive
          // surface (the "open detail" button) — the game link is its own
          // navigation target.
          onClick={(event) => event.stopPropagation()}
        >
          <span className="font-medium">{entry.game.title}</span>
        </Link>
      ) : null}
    </CardContent>
  );

  return (
    <article aria-labelledby={`journal-entry-${entry.id}-heading`}>
      <Card className="transition-colors">
        {interactive ? (
          <button
            type="button"
            onClick={() => onSelect(entry.id)}
            aria-label={`Open journal entry from ${formatEntryDate(entry.updatedAt)}`}
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
