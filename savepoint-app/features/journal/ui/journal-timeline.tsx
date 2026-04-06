"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

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

      // Fetch games for new entries
      const newGameIds = [
        ...new Set(newEntries.map((entry) => entry.gameId)),
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
          <h2 className="text-lg font-semibold">Your Gaming Journal</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Capture your gaming sessions — what you played, memorable moments,
            and quick thoughts. Entries are tied to games in your library.
          </p>
        </div>
        <Button asChild>
          <Link href="/journal/new">Write Your First Entry</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <div className="flex items-center justify-between">
        <h2 className="heading-md font-semibold">Journal Entries</h2>
        <Button asChild variant="secondary" size="sm">
          <Link href="/journal/new">Write New Entry</Link>
        </Button>
      </div>

      <div className="space-y-lg">
        {entries.map((entry) => {
          const game = games.get(entry.gameId);
          if (!game) {
            // Skip entries with missing games (shouldn't happen, but handle gracefully)
            return null;
          }
          return (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              game={{
                id: game.id,
                title: game.title,
                slug: game.slug,
                coverImage: game.coverImage,
              }}
            />
          );
        })}
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
