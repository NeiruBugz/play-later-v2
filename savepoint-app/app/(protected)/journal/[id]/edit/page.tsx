import { JournalService } from "@/data-access-layer/services";
import { notFound } from "next/navigation";

import { EditJournalEntryPage as EditJournalEntryPageContent } from "@/features/journal";
import { requireServerUserId } from "@/shared/lib/app/auth";
import { NotFoundError } from "@/shared/lib/errors";

export default async function EditJournalEntryPage({
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

  return <EditJournalEntryPageContent entry={entry} />;
}
