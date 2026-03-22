import { NewJournalEntryPage } from "@/features/journal/ui/new-journal-entry-page";

export const dynamic = "force-dynamic";

export default async function NewJournalEntryRoute() {
  return (
    <main className="py-3xl container mx-auto">
      <NewJournalEntryPage />
    </main>
  );
}
