import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ComposeJournalEntryForm } from "@/features/compose-journal-entry";

const searchSchema = z.object({
  gameId: z.string().min(1).optional(),
});

/**
 * `/journal/new` — full-page compose form (Slice 23 page restore for URL +
 * UX parity with canonical's `NewJournalEntryPage`). Auth is enforced by the
 * `_authed` group guard. `?gameId=` pre-selects a game association, mirroring
 * canonical's `searchParams.get("gameId")`.
 */
export const Route = createFileRoute("/_authed/journal/new")({
  validateSearch: searchSchema.parse,
  component: NewJournalEntryRoute,
});

function NewJournalEntryRoute() {
  const { gameId } = Route.useSearch();

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="space-y-xl mx-auto max-w-3xl">
        <header className="space-y-md">
          <h1 className="text-h1">Write New Entry</h1>
          <p className="text-muted-foreground body-md">
            Share your thoughts and experiences
          </p>
        </header>
        <ComposeJournalEntryForm defaultGameId={gameId ?? null} />
      </div>
    </main>
  );
}
