import type { JournalTimelineEntry } from "@/entities/journal-entry/model/types";
import { Button } from "@/shared/ui/button";

type NestedJournalProps = {
  playthroughId: string;
  entries: JournalTimelineEntry[];
  onLogSession: () => void;
};

function formatEntryDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatEntryHours(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  return `${Math.floor(minutes / 60)}h`;
}

export function NestedJournal({ entries, onLogSession }: NestedJournalProps) {
  return (
    <div className="gap-xs flex flex-col">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          {`JOURNAL · ${entries.length}`}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onLogSession}
        >
          Log session
        </Button>
      </div>

      {entries.length > 0 ? (
        <ul className="gap-xs flex flex-col">
          {entries.map((entry) => {
            const hours = formatEntryHours(entry.playedMinutes);
            return (
              <li
                key={entry.id}
                className="text-muted-foreground flex flex-col text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span>{formatEntryDate(entry.createdAt)}</span>
                  {hours ? <span className="font-mono">{hours}</span> : null}
                </div>
                <em className="font-normal not-italic">{entry.content}</em>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
