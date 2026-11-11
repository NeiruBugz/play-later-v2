import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { formatDayMonth } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";
import { SectionLabel } from "@/shared/ui/section-label";

import type { Play, PlayHistoryProps } from "./play-history.type";

function formatRange(play: Play): string {
  const started = play.startedAt === null ? "" : formatDayMonth(play.startedAt);
  if (play.finishedAt === null) return started;
  return `${started} \u2013 ${formatDayMonth(play.finishedAt)}`.trim();
}

function endedTime(play: Play): number {
  return new Date(play.finishedAt ?? play.startedAt ?? 0).getTime();
}

export function PlayHistory({ plays }: PlayHistoryProps) {
  const [open, setOpen] = useState(false);

  if (plays.length === 0) return null;

  const newestFirst = [...plays].sort((a, b) => endedTime(b) - endedTime(a));

  return (
    <section className="flex flex-col gap-2" data-testid="play-history">
      <SectionLabel>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="play-history-list"
          onClick={() => setOpen((current) => !current)}
          className="flex min-h-11 items-center gap-2 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:min-h-0"
        >
          History
          <ChevronDown
            aria-hidden="true"
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </button>
      </SectionLabel>
      {open ? (
        <ul
          id="play-history-list"
          className="flex flex-col gap-1 text-base md:text-sm"
        >
          {newestFirst.map((play) => (
            <li key={play.id} className="tabular-nums">
              {formatRange(play)}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
