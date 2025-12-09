import { JournalService } from "@/data-access-layer/services";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { requireServerUserId } from "@/shared/lib/app/auth";
import { prisma } from "@/shared/lib/app/db";

import { JournalEntryCard } from "./journal-entry-card";

export async function JournalTimeline() {
  const userId = await requireServerUserId();

  const journalService = new JournalService();
  const entriesResult = await journalService.findJournalEntriesByUserId({
    userId,
    limit: 20,
  });

  if (!entriesResult.success) {
    return (
      <div className="space-y-lg border-border/50 bg-muted/10 p-3xl flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
        <p className="body-sm text-muted-foreground">
          Failed to load journal entries. Please try again later.
        </p>
      </div>
    );
  }

  const entries = entriesResult.data;

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

  // Fetch all games for the entries in a single query
  const gameIds = [...new Set(entries.map((entry) => entry.gameId))];
  const games = await prisma.game.findMany({
    where: {
      id: { in: gameIds },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
    },
  });

  // Create a map for quick lookup
  const gameMap = new Map(games.map((game) => [game.id, game]));

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
          const game = gameMap.get(entry.gameId);
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
    </div>
  );
}
