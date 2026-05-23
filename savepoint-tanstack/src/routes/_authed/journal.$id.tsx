import { createFileRoute, Link } from "@tanstack/react-router";

import { getJournalEntryPageDataFn } from "@/features/journal-timeline";
import { AppError } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import { JournalEntryPage } from "@/widgets/journal-entry-page";

/**
 * `/journal/$id` — single journal entry detail page (Slice 23 page restore).
 *
 * The loader reads the entry via the loader-safe `getJournalEntryPageDataFn`
 * (foot-gun #2: route loaders must not import `.server.ts` modules directly).
 * Ownership / privacy is enforced inside the entity query, which throws
 * `NotFoundError` for both missing and cross-user — the `errorComponent`
 * branches on `AppError.code === "NOT_FOUND"` for the 404 surface.
 */
export const Route = createFileRoute("/_authed/journal/$id")({
  loader: ({ params }) =>
    getJournalEntryPageDataFn({ data: { entryId: params.id } }),
  component: JournalEntryDetailRoute,
  errorComponent: JournalEntryErrorBoundary,
});

function JournalEntryDetailRoute() {
  const entry = Route.useLoaderData();

  return (
    <main className="container mx-auto px-4 py-6">
      <JournalEntryPage
        entry={{
          id: entry.id,
          kind: entry.kind,
          title: entry.title,
          content: entry.content,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          game: entry.game
            ? {
                id: entry.game.id,
                title: entry.game.title,
                slug: entry.game.slug,
              }
            : null,
        }}
      />
    </main>
  );
}

function JournalEntryErrorBoundary({ error }: { error: Error }) {
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
