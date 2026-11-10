import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { EditJournalEntryForm } from "@/features/edit-journal-entry";
import { getJournalEntryPageDataFn } from "@/features/journal-timeline";
import { AppError } from "@/shared/lib/errors";
import { buttonVariants } from "@/shared/ui/button";

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
  loader: async ({ params }) => {
    try {
      return await getJournalEntryPageDataFn({ data: { entryId: params.id } });
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") {
        throw notFound();
      }
      throw error;
    }
  },
  component: EditJournalEntryRoute,
  notFoundComponent: JournalEntryNotFound,
  errorComponent: EditJournalEntryErrorBoundary,
});

function EditJournalEntryRoute() {
  const entry = Route.useLoaderData();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-h1 mb-xl">Edit note</h1>
        <EditJournalEntryForm
          entry={{
            id: entry.id,
            content: entry.content,
            playedMinutes: entry.playedMinutes,
            gameId: entry.game?.id ?? null,
          }}
        />
      </div>
    </div>
  );
}

function EditJournalEntryErrorBoundary() {
  return (
    <div
      role="alert"
      className="gap-md container mx-auto flex flex-col px-4 py-12"
    >
      <h1 className="text-h2">Something went wrong</h1>
      <p>An error occurred while loading this note. Please try again.</p>
      <Link to="/journal" className={buttonVariants({ variant: "outline" })}>
        Back to journal
      </Link>
    </div>
  );
}

function JournalEntryNotFound() {
  return (
    <div
      role="alert"
      className="gap-md container mx-auto flex flex-col px-4 py-12"
    >
      <h1 className="text-h2">Note not found</h1>
      <p>We couldn't find a note matching this URL.</p>
      <Link to="/journal" className={buttonVariants({ variant: "outline" })}>
        Back to journal
      </Link>
    </div>
  );
}
