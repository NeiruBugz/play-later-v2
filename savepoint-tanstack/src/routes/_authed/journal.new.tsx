import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { LogFormHost } from "@/widgets/global-action-host";

const searchSchema = z.object({
  game: z.string().min(1).optional(),
});

/**
 * `/journal/new` — the Log form rendered full-page. Auth is enforced by the
 * `_authed` group guard. `?game=<slug>` pre-chooses the game.
 */
export const Route = createFileRoute("/_authed/journal/new")({
  validateSearch: searchSchema.parse,
  component: NewNoteRoute,
});

function NewNoteRoute() {
  const { game } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="space-y-xl mx-auto max-w-3xl">
        <header className="space-y-md">
          <h1 className="text-h1">New note</h1>
          <p className="text-muted-foreground body-md">
            Log time played or write a note about a game in your library.
          </p>
        </header>
        <LogFormHost
          gameSlug={game}
          onClose={() => void navigate({ to: "/journal" })}
        />
      </div>
    </main>
  );
}
