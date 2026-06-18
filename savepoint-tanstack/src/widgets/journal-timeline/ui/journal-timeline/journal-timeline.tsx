import { JournalEntryCard } from "@/entities/journal-entry/ui/journal-entry-card";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { EmptyState } from "@/shared/ui/empty-state";

import type {
  JournalTimelineEntry,
  JournalTimelineProps,
} from "./journal-timeline.type";

export type { JournalTimelineEntry };

/**
 * Widget that composes journal entries into a vertical timeline with a
 * continuous rail line on the left and a circular game-cover node per entry.
 *
 * Layout: a thin vertical bar runs behind the column; each row is
 * [cover-node | card]. The cover node is a 36 × 36 circular avatar sitting
 * on the rail; the card fills the remaining width.
 *
 * Display-only: data is fetched by the route loader and passed in as a prop.
 */
export function JournalTimeline({
  entries,
  onEntrySelect,
}: JournalTimelineProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="Nothing logged yet"
        description="Log tonight's session — a playtime count or a quick thought is enough. Reflections can come later."
      />
    );
  }

  return (
    // `role="list"` is implicit on <ul>; aria-label satisfies the a11y requirement
    // and gives RTL a findable landmark.
    <ul
      className="gap-md relative flex flex-col"
      aria-label="Journal timeline"
      role="list"
    >
      {/* Continuous vertical rail line behind the nodes */}
      <li
        aria-hidden="true"
        className="bg-border/70 pointer-events-none absolute top-1.5 bottom-1.5 left-[17px] w-0.5"
      />

      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3.5">
          {/* Circular cover-avatar node sitting on the rail */}
          <div className="relative z-10 flex shrink-0 items-start pt-1">
            <CoverAvatar game={entry.game} />
          </div>

          {/* Entry card fills the remaining width */}
          <div className="min-w-0 flex-1">
            <JournalEntryCard entry={entry} onSelect={onEntrySelect} />
          </div>
        </li>
      ))}
    </ul>
  );
}

type CoverAvatarProps = {
  game: JournalTimelineEntry["game"];
};

function CoverAvatar({ game }: CoverAvatarProps) {
  const coverUrl = game?.coverImage
    ? buildCoverImageUrl(game.coverImage, "t_cover_small")
    : null;

  return (
    <div className="border-background shadow-paper-sm size-9 overflow-hidden rounded-full border-2">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={`Cover for ${game!.title}`}
          className="size-full object-cover"
        />
      ) : (
        <div
          className="bg-muted flex size-full items-center justify-center"
          aria-hidden="true"
        >
          <span className="text-caption text-muted-foreground font-mono select-none">
            {game?.title?.slice(0, 2).toUpperCase() ?? "??"}
          </span>
        </div>
      )}
    </div>
  );
}
