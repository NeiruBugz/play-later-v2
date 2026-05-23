import { EmptyState } from "@/shared/ui/empty-state";

import type { JournalTeaserProps } from "./journal-teaser.type";

function formatEntryDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

/**
 * Read-only teaser of a viewer's recent journal entries for a game.
 *
 * Entity layer: display-only. The optional `onAddEntryClick` callback lets a
 * composing widget surface an inline "Add entry" affordance without the
 * entity importing the compose feature.
 */
export function JournalTeaser({
  entries,
  onAddEntryClick,
}: JournalTeaserProps) {
  const renderAddEntry = typeof onAddEntryClick === "function";

  if (entries.length === 0) {
    return (
      <EmptyState
        spacing="compact"
        title="No journal entries yet."
        action={
          renderAddEntry
            ? { label: "Add entry", onClick: onAddEntryClick, variant: "link" }
            : undefined
        }
      />
    );
  }

  return (
    <div className="gap-md flex flex-col">
      {renderAddEntry ? (
        <button
          type="button"
          onClick={onAddEntryClick}
          className="text-primary hover:text-primary/80 focus-visible:ring-ring self-start text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          Add entry
        </button>
      ) : null}
      <ul className="gap-md flex flex-col" aria-label="Recent journal entries">
        {entries.map((entry) => {
          const title = entry.title?.trim() || "Untitled entry";
          const snippet = entry.content?.trim() ?? "";
          return (
            <li
              key={entry.id}
              className="border-border gap-2xs flex flex-col border-l-2 pl-3"
            >
              <time
                dateTime={new Date(entry.createdAt).toISOString()}
                className="text-muted-foreground font-mono text-xs"
              >
                {formatEntryDate(entry.createdAt)}
              </time>
              <p className="text-sm leading-snug font-semibold">{title}</p>
              {snippet ? (
                <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                  {snippet}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
