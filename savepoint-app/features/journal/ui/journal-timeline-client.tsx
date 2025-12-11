"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/shared/components/ui/button";
import type { JournalEntryDomain } from "@/shared/types/journal";

import { getGamesByIdsAction } from "../server-actions/get-games-by-ids";
import { getJournalEntriesAction } from "../server-actions/get-journal-entries";
import { JournalEntryCard } from "./journal-entry-card";

interface GameInfo {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
}

interface JournalTimelineClientProps {
  initialEntries: JournalEntryDomain[];
  initialGames: Record<string, GameInfo>;
}

export function JournalTimelineClient({
  initialEntries,
  initialGames,
}: JournalTimelineClientProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [games, setGames] = useState(() => new Map(Object.entries(initialGames)));
  const [isPending, startTransition] = useTransition();
  const [hasMore, setHasMore] = useState(initialEntries.length === 20);

  const handleLoadMore = () => {
    if (isPending || !hasMore) return;

    const lastEntry = entries[entries.length - 1];
    if (!lastEntry) return;

    startTransition(async () => {
      const result = await getJournalEntriesAction({
        cursor: lastEntry.id,
        limit: 20,
      });

      if (result.success) {
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

          if (gamesResult.success) {
            setGames((prev) => {
              const updated = new Map(prev);
              gamesResult.data.forEach((game) => {
                updated.set(game.id, game);
              });
              return updated;
            });
          }
        }
      }
    });
  };

  if (entries.length === 0) {
    return (
      <div className="space-y-lg border-border/50 bg-muted/10 p-3xl flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
        <div className="space-y-md">
          <h2 className="heading-md font-medium">No journal entries yet</h2>
          <p className="body-sm text-muted-foreground">
            Start documenting your gaming journey
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/journal/new">Write Your First Entry</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <div className="flex items-center justify-between">
        <h2 className="heading-md font-serif">Journal Entries</h2>
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

      {hasMore && (
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
