import { getGameById, JournalService } from "@/data-access-layer/services";
import { notFound } from "next/navigation";

import { JournalEntryDetail } from "@/features/journal";
import { requireServerUserId } from "@/shared/lib/app/auth";
import { NotFoundError } from "@/shared/lib/errors";

export default async function JournalEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireServerUserId();
  const { id } = await params;

  const journalService = new JournalService();

  let entry;
  try {
    entry = await journalService.findJournalEntryById({ entryId: id, userId });
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  if (entry.gameId === null) {
    notFound();
  }

  const game = await getGameById(entry.gameId);

  if (!game) {
    notFound();
  }

  return (
    <div className="py-3xl container mx-auto">
      <JournalEntryDetail
        entry={entry}
        game={{
          id: game.id,
          title: game.title,
          slug: game.slug,
          coverImage: game.coverImage,
        }}
      />
    </div>
  );
}
