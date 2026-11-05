import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { PageHeader } from "@/shared/ui/page-header";
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
    <section className="container mx-auto px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <PageHeader
          title="New note"
          sub="Log time played or write a note about a game in your library."
          className="mb-0"
        />
        <LogFormHost
          gameSlug={game}
          onClose={() => void navigate({ to: "/journal" })}
        />
      </div>
    </section>
  );
}
