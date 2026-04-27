import { NewJournalEntryPage } from "@/features/journal";
import { requireServerUserId } from "@/shared/lib/app/auth";

export default async function NewJournalEntryRoute() {
  await requireServerUserId();

  return (
    <div className="py-3xl container mx-auto">
      <NewJournalEntryPage />
    </div>
  );
}
