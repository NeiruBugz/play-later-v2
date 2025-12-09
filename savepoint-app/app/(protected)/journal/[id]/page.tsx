import { JournalService } from "@/data-access-layer/services";
import { notFound } from "next/navigation";

import { JournalEntryDetail } from "@/features/journal/ui/journal-entry-detail";
import { requireServerUserId } from "@/shared/lib/app/auth";
import { prisma } from "@/shared/lib/app/db";

export const dynamic = "force-dynamic";

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

  // Fetch game information
  const game = await prisma.game.findUnique({
    where: { id: entry.gameId },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
    },
  });

  if (!game) {
    notFound();
  }

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
