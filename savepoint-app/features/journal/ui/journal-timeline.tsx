"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { GameCardCover } from "@/widgets/game-card";
import type { JournalEntryDomain } from "@/features/journal/types";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";

import { getGamesByIdsAction } from "../server-actions/get-games-by-ids";
import { getJournalEntriesAction } from "../server-actions/get-journal-entries";
import { JournalEntryCard } from "./journal-entry-card";

interface GameInfo {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
}

interface JournalTimelineProps {
  initialEntries: JournalEntryDomain[];
  initialGames: Record<string, GameInfo>;
}

interface GameGroup {
  game: GameInfo;
  entries: JournalEntryDomain[];
  latestEntryAt: Date;
}

function groupEntriesByGame(
  entries: JournalEntryDomain[],
  games: Map<string, GameInfo>
): GameGroup[] {
  const groupMap = new Map<string, GameGroup>();

  for (const entry of entries) {
    if (entry.gameId === null) continue;
    const game = games.get(entry.gameId);
    if (!game) continue;

    const existing = groupMap.get(entry.gameId);
    if (existing) {
      existing.entries.push(entry);
      if (entry.createdAt > existing.latestEntryAt) {
        existing.latestEntryAt = entry.createdAt;
      }
    } else {
      groupMap.set(entry.gameId, {
        game,
        entries: [entry],
        latestEntryAt: entry.createdAt,
      });
    }
  }

  for (const group of groupMap.values()) {
    group.entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return Array.from(groupMap.values()).sort(
    (a, b) => b.latestEntryAt.getTime() - a.latestEntryAt.getTime()
  );
}

function entryCountLabel(count: number): string {
  return count === 1 ? "1 entry" : `${count} entries`;
}

export function JournalTimeline({
  initialEntries,
  initialGames,
}: JournalTimelineProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [games, setGames] = useState(
    () => new Map(Object.entries(initialGames))
  );
  const [isPending, startTransition] = useTransition();
  const [hasMore, setHasMore] = useState(initialEntries.length === 20);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleLoadMore = () => {
    if (isPending || !hasMore) return;

    const lastEntry = entries[entries.length - 1];
    if (!lastEntry) return;

    setLoadError(null);

    startTransition(async () => {
      const result = await getJournalEntriesAction({
        cursor: lastEntry.id,
        limit: 20,
      });

      if (!result.success) {
        setLoadError("Failed to load more entries. Please try again.");
        return;
      }

      const newEntries = result.data;
      setEntries((prev) => [...prev, ...newEntries]);
      setHasMore(newEntries.length === 20);

      const newGameIds = [
        ...new Set(
          newEntries
            .map((entry) => entry.gameId)
            .filter((id): id is string => id !== null)
        ),
      ].filter((id) => !games.has(id));

      if (newGameIds.length > 0) {
        const gamesResult = await getGamesByIdsAction({
          gameIds: newGameIds,
        });

        if (!gamesResult.success) {
          setLoadError(
            "Loaded entries but failed to fetch game details. Some entries may not display correctly."
          );
          return;
        }

        setGames((prev) => {
          const updated = new Map(prev);
          gamesResult.data.forEach((game) => {
            updated.set(game.id, game);
          });
          return updated;
        });
      }
    });
  };

  if (entries.length === 0) {
    return (
      <div className="bg-card border-border/10 space-y-xl flex min-h-[280px] flex-col items-center justify-center rounded-lg border px-6 py-12 text-center">
        <div className="space-y-sm max-w-md">
          <h2 className="text-lg font-semibold">Nothing logged yet</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Log tonight&apos;s session — a playtime count or a quick thought is
            enough. Reflections can come later.
          </p>
        </div>
        <Button asChild>
          <Link href="/journal/new">Log a session</Link>
        </Button>
      </div>
    );
  }

  const groups = groupEntriesByGame(entries, games);

  return (
    <div className="space-y-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold">Journal Entries</h2>
        <Button asChild variant="secondary" size="sm">
          <Link href="/journal/new">Write New Entry</Link>
        </Button>
      </div>

      <div className="space-y-3xl">
        {groups.map((group) => (
          <section key={group.game.id}>
            <Link
              href={`/games/${group.game.slug}`}
              className="hover:text-primary mb-lg flex items-center gap-3 transition-colors"
            >
              {group.game.coverImage && (
                <GameCardCover
                  imageId={group.game.coverImage}
                  gameTitle={group.game.title}
                  size="cover_small"
                  aspectRatio="portrait"
                  className="h-10 w-7 flex-shrink-0 rounded"
                  enableHoverEffect={false}
                />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-h3 truncate font-semibold">
                  {group.game.title}
                </h2>
                <span className="text-caption text-muted-foreground">
                  {entryCountLabel(group.entries.length)}
                </span>
              </div>
            </Link>

            <div className="space-y-lg">
              {group.entries.map((entry) => (
                <JournalEntryCard
                  key={entry.id}
                  entry={entry}
                  game={group.game}
                  hideGameMetadata
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{loadError}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isPending}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {hasMore && !loadError && (
        <div className="pt-lg flex justify-center">
          <Button
            onClick={handleLoadMore}
            disabled={isPending}
            variant="outline"
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
