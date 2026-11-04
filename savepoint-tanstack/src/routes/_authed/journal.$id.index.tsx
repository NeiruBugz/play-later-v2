import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { getJournalEntryPageDataFn } from "@/features/journal-timeline";
import { AppError } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import { JournalEntryPage } from "@/widgets/journal-entry-page";

/**
 * `/journal/$id` — single note view (Slice 23 page restore).
 *
 * The loader reads the entry via the loader-safe `getJournalEntryPageDataFn`
 * (foot-gun #2: route loaders must not import `.server.ts` modules directly).
 * Ownership / privacy is enforced inside the entity query, which throws
 * `NotFoundError` for both missing and cross-user — the `errorComponent`
 * branches on `AppError.code === "NOT_FOUND"` for the 404 surface.
 */
export const Route = createFileRoute("/_authed/journal/$id/")({
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
  component: JournalEntryDetailRoute,
  notFoundComponent: JournalEntryNotFound,
  errorComponent: JournalEntryErrorBoundary,
});

function JournalEntryDetailRoute() {
  const entry = Route.useLoaderData();

  return (
    <div className="container mx-auto px-4 py-6">
      <JournalEntryPage
        entry={{
          id: entry.id,
          content: entry.content,
          playedMinutes: entry.playedMinutes,
          prompt: entry.prompt,
          createdAt: entry.createdAt,
          game: entry.game
            ? {
                id: entry.game.id,
                title: entry.game.title,
                slug: entry.game.slug,
              }
            : null,
        }}
      />
    </div>
  );
}

function JournalEntryErrorBoundary() {
  return (
    <div
      role="alert"
      className="gap-md container mx-auto flex flex-col px-4 py-12"
    >
      <h1 className="text-h2">Something went wrong</h1>
      <p>An error occurred while loading this note. Please try again.</p>
      <Button asChild variant="outline">
        <Link to="/journal">Back to journal</Link>
      </Button>
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
      <Button asChild variant="outline">
        <Link to="/journal">Back to journal</Link>
      </Button>
    </div>
  );
}
