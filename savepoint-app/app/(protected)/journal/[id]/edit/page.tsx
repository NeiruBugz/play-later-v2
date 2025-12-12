import { JournalService } from "@/data-access-layer/services";
import { notFound } from "next/navigation";

import { EditJournalEntryPageClient } from "@/features/journal/ui/edit-journal-entry-page-client";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const dynamic = "force-dynamic";

export default async function EditJournalEntryPage({
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

  return <EditJournalEntryPageClient entry={entry} />;
}
