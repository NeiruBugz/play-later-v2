import { Link } from "@tanstack/react-router";

import { PROMPT_QUESTION } from "@/entities/journal-entry";
import { formatHours, formatJournalDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

import type { GameNote, GameNotesListProps } from "./game-notes-list.type";

function noteText(note: GameNote): string {
  const content = note.content.trim();
  if (content) return content;
  return note.playedMinutes ? `${formatHours(note.playedMinutes)} played` : "";
}

/**
 * The game's notes, newest first, each once. A note with time and text shows
 * the time beside its date; a time-only note reads "{time} played". Every note
 * opens its note view.
 */
export function GameNotesList({ notes, onNewNote }: GameNotesListProps) {
  const newestFirst = [...notes].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 id="game-notes-heading" className="terminal-label">
          // NOTES
        </h2>
        <Button type="button" size="sm" variant="outline" onClick={onNewNote}>
          New note
        </Button>
      </div>

      {newestFirst.length === 0 ? (
        <EmptyState spacing="compact" title="No notes yet." />
      ) : (
        <ul
          className="gap-md flex flex-col"
          aria-labelledby="game-notes-heading"
        >
          {newestFirst.map((note) => (
            <li key={note.id}>
              <Link
                to="/journal/$id"
                params={{ id: note.id }}
                className="border-border hover:bg-muted/40 gap-2xs focus-visible:ring-ring flex flex-col border-l-2 pl-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="text-muted-foreground flex items-center gap-2 font-mono text-xs">
                  <time dateTime={note.createdAt.toISOString()}>
                    {formatJournalDate(note.createdAt)}
                  </time>
                  {note.content.trim() && note.playedMinutes ? (
                    <span>{formatHours(note.playedMinutes)}</span>
                  ) : null}
                </span>
                {note.prompt ? (
                  <span className="text-sm font-medium">
                    {PROMPT_QUESTION[note.prompt]}
                  </span>
                ) : null}
                <span className="line-clamp-2 text-sm leading-snug">
                  {noteText(note)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
