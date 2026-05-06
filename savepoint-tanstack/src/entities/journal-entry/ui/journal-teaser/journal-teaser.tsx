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
 * Compose / edit flow is Slice 16.
 */
export function JournalTeaser({ entries }: JournalTeaserProps) {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No journal entries yet.</p>
    );
  }

  return (
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
              className="text-muted-foreground text-xs font-mono"
            >
              {formatEntryDate(entry.createdAt)}
            </time>
            <p className="text-sm font-semibold leading-snug">{title}</p>
            {snippet ? (
              <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                {snippet}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
