import { JournalService } from "@/data-access-layer/services";

import { requireServerUserId } from "@/shared/lib/app/auth";
import { prisma } from "@/shared/lib/app/db";

import { JournalTimelineClient } from "./journal-timeline-client";

export async function JournalTimelineServer() {
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

  // Fetch all games for the entries in a single query
  // If no entries, pass empty arrays and let client component handle empty state
  const gameIds =
    entries.length > 0
      ? [...new Set(entries.map((entry) => entry.gameId))]
      : [];
  const games =
    gameIds.length > 0
      ? await prisma.game.findMany({
          where: {
            id: { in: gameIds },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
          },
        })
      : [];

  // Create a map for quick lookup
  const gameMap = new Map(
    games.map((game) => [
      game.id,
      {
        id: game.id,
        title: game.title,
        slug: game.slug,
        coverImage: game.coverImage,
      },
    ])
  );

  return (
    <JournalTimelineClient initialEntries={entries} initialGames={gameMap} />
  );
}

