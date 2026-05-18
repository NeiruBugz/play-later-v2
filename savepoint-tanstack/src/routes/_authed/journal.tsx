import { createFileRoute } from "@tanstack/react-router";

import { getJournalTimelinePageDataFn } from "@/features/journal-timeline";
import { JournalTimelinePage } from "@/widgets/journal-timeline-page";

export const Route = createFileRoute("/_authed/journal")({
  loader: () => getJournalTimelinePageDataFn(),
  component: JournalPage,
});

function JournalPage() {
  const entries = Route.useLoaderData();

  return (
    <main className="container mx-auto px-4 py-6">
      <JournalTimelinePage entries={entries} />
    </main>
  );
}
