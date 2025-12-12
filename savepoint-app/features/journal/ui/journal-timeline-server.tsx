import { GameService, JournalService } from "@/data-access-layer/services";

import { requireServerUserId } from "@/shared/lib/app/auth";

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

  // Fetch all games for the entries using service layer
  const gameIds =
    entries.length > 0
      ? [...new Set(entries.map((entry) => entry.gameId))]
      : [];

  const gameService = new GameService();
  const gamesResult = await gameService.getGamesByIds({ ids: gameIds });

  // Create a record for quick lookup (empty record if fetch failed)
  const games = gamesResult.success ? gamesResult.data : [];
  const gameRecord: Record<
    string,
    { id: string; title: string; slug: string; coverImage: string | null }
  > = {};

  games.forEach((game) => {
    gameRecord[game.id] = {
      id: game.id,
      title: game.title,
      slug: game.slug,
      coverImage: game.coverImage,
    };
  });

  return (
    <JournalTimelineClient initialEntries={entries} initialGames={gameRecord} />
  );
}
