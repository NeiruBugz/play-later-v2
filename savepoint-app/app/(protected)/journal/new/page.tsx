import { NewJournalEntryPage } from "@/features/journal/ui/new-journal-entry-page";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const dynamic = "force-dynamic";

export default async function NewJournalEntryRoute() {
  await requireServerUserId();

  return (
    <main className="py-3xl container mx-auto">
      <NewJournalEntryPage />
    </main>
  );
}
