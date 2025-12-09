import { JournalTimelineServer } from "@/features/journal/ui/journal-timeline-server";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  await requireServerUserId();

  return (
    <main className="py-3xl container mx-auto">
      <div className="space-y-3xl">
        <header>
          <h1 className="heading-xl font-serif">My Journal</h1>
          <p className="body-md text-muted-foreground">
            Document your gaming journey
          </p>
        </header>

        <JournalTimelineServer />
      </div>
    </main>
  );
}
