import { getGameById, JournalService } from "@/data-access-layer/services";
import { notFound } from "next/navigation";

import { JournalEntryDetail } from "@/features/journal";
import { requireServerUserId } from "@/shared/lib/app/auth";

export default async function JournalEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireServerUserId();
  const { id } = await params;

  const journalService = new JournalService();
  const entryResult = await journalService.findJournalEntryById({
    entryId: id,
    userId,
  });

  if (!entryResult.success) {
    notFound();
  }

  const entry = entryResult.data;

  const gameResult = await getGameById(entry.gameId);

  if (!gameResult.success || !gameResult.data) {
    notFound();
  }

  const game = gameResult.data;

  return (
    <main className="py-3xl container mx-auto">
      <JournalEntryDetail
        entry={entry}
        game={{
          id: game.id,
          title: game.title,
          slug: game.slug,
          coverImage: game.coverImage,
        }}
      />
    </main>
  );
}
