import { createFileRoute, Link } from "@tanstack/react-router";

import { EditJournalEntryForm } from "@/features/edit-journal-entry";
import { getJournalEntryPageDataFn } from "@/features/journal-timeline";
import { AppError } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";

/**
 * `/journal/$id/edit` — full-page edit form (Slice 23 page restore).
 *
 * The loader reads the entry via the loader-safe `getJournalEntryPageDataFn`
 * (foot-gun #2). Ownership / privacy is enforced inside the entity query
 * (`NotFoundError` for both missing and cross-user). On submit the form calls
 * `updateJournalEntryFn` and, on success, navigates to `/journal/$id`
 * (canonical parity).
 */
export const Route = createFileRoute("/_authed/journal/$id/edit")({
  loader: ({ params }) =>
    getJournalEntryPageDataFn({ data: { entryId: params.id } }),
  component: EditJournalEntryRoute,
  errorComponent: EditJournalEntryErrorBoundary,
});

function EditJournalEntryRoute() {
  const entry = Route.useLoaderData();

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-h1 mb-xl">Edit Journal Entry</h1>
        <EditJournalEntryForm
          entry={{
            id: entry.id,
            content: entry.content,
            kind: entry.kind,
            gameId: entry.game?.id ?? null,
          }}
        />
      </div>
    </main>
  );
}

function EditJournalEntryErrorBoundary({ error }: { error: Error }) {
  const isNotFound = error instanceof AppError && error.code === "NOT_FOUND";

  if (isNotFound) {
    return (
      <main
        role="alert"
        className="gap-md container mx-auto flex flex-col px-4 py-12"
      >
        <h1 className="text-h2">Entry not found</h1>
        <p>We couldn't find a journal entry matching this URL.</p>
        <Button asChild variant="outline">
          <Link to="/journal">Back to journal</Link>
        </Button>
      </main>
    );
  }

  return (
    <main
      role="alert"
      className="gap-md container mx-auto flex flex-col px-4 py-12"
    >
      <h1 className="text-h2">Something went wrong</h1>
      <p>An error occurred while loading this entry. Please try again.</p>
      <Button asChild variant="outline">
        <Link to="/journal">Back to journal</Link>
      </Button>
    </main>
  );
}
