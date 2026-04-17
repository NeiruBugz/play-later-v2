import type { JournalEntry } from "@prisma/client";
import Link from "next/link";

import { GameCardCover } from "@/widgets/game-card";
import { JournalEntryCard } from "@/features/journal";
import { Card, CardContent } from "@/shared/components/ui/card";
import { stripHtmlTags } from "@/shared/lib/rich-text";

import {
  bucketEntriesByWeek,
  formatPlaytime,
  type TimelineQuickGroup,
  type TimelineSingleEntry,
} from "../lib/bucket";

type GameInfo = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
};

type TimelineViewProps = {
  entries: JournalEntry[];
  games: Record<string, GameInfo>;
};

function QuickGroupCard({
  group,
  game,
}: {
  group: TimelineQuickGroup;
  game: GameInfo | undefined;
}) {
  const sessionCount = group.entries.length;
  const playtimeLabel = formatPlaytime(group.totalMinutes);

  const firstNote = group.entries.find(
    (e) => e.content && stripHtmlTags(e.content).trim().length > 0
  );
  const notePreview = firstNote
    ? stripHtmlTags(firstNote.content).trim().slice(0, 100)
    : null;

  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardContent className="p-md gap-md flex items-center">
        {game?.coverImage && (
          <GameCardCover
            imageId={game.coverImage}
            gameTitle={game.title}
            size="cover_small"
            aspectRatio="portrait"
            className="h-14 w-10 flex-shrink-0"
            enableHoverEffect={false}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            {game ? (
              <Link
                href={`/games/${game.slug}`}
                className="body-sm truncate font-medium hover:underline"
              >
                {game.title}
              </Link>
            ) : (
              <span className="body-sm text-muted-foreground truncate">
                Unknown game
              </span>
            )}
            <span className="text-muted-foreground body-sm ml-auto flex-shrink-0 tabular-nums">
              {sessionCount} sessions
              {playtimeLabel ? ` · ${playtimeLabel}` : ""}
            </span>
          </div>
          {notePreview && (
            <p className="body-sm text-muted-foreground mt-1 line-clamp-1">
              {notePreview}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SingleEntry({
  single,
  games,
}: {
  single: TimelineSingleEntry;
  games: Record<string, GameInfo>;
}) {
  const entry = single.entry;
  if (!entry.gameId) return null;
  const game = games[entry.gameId];
  if (!game) return null;

  return <JournalEntryCard entry={entry} game={game} />;
}

export function TimelineView({ entries, games }: TimelineViewProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-card border-border/10 space-y-xl flex min-h-[280px] flex-col items-center justify-center rounded-lg border px-6 py-12 text-center">
        <div className="space-y-sm max-w-md">
          <h2 className="text-lg font-semibold">No memories yet</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Log a session or write a reflection — your journey will start
            showing up here, grouped by the weeks you played.
          </p>
        </div>
      </div>
    );
  }

  const weeks = bucketEntriesByWeek(entries);

  return (
    <div className="space-y-2xl">
      {weeks.map((week) => (
        <section
          key={week.weekKey}
          aria-label={week.weekLabel}
          className="space-y-md"
        >
          <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {week.weekLabel}
          </h2>
          <div className="space-y-sm">
            {week.items.map((item, idx) => {
              if (item.kind === "quick-group") {
                return (
                  <QuickGroupCard
                    key={`${week.weekKey}-${item.gameId}-${idx}`}
                    group={item}
                    game={games[item.gameId]}
                  />
                );
              }
              return (
                <SingleEntry key={item.entry.id} single={item} games={games} />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
