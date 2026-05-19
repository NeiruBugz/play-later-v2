import { Link } from "@tanstack/react-router";
import { BookOpen, Plus } from "lucide-react";
import { useState } from "react";

import { ComposeJournalEntryDialog } from "@/features/compose-journal-entry";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { Button } from "@/shared/ui/button";

import type { DashboardQuickLogHeroProps } from "./dashboard-quick-log-hero.type";

/**
 * Reflection-first dashboard hero. Mirrors canonical's two-state shape:
 *  - With PLAYING games: 1-3 mini cards each with a primary "Log Session"
 *    button that opens `ComposeJournalEntryDialog` preselected to that game,
 *    plus a subdued "Reflect" link.
 *  - Empty state: prompt + CTA to find a game on the shelf.
 *
 * Canonical opens `JournalQuickEntrySheet`; tanstack reuses
 * `ComposeJournalEntryDialog` (slice-16 feature) since the Sheet variant
 * isn't ported. The UX is equivalent: "click the game's Log button → form
 * preselected to that game opens."
 *
 * The dialog instance is reset between selections by keying on the active
 * `igdbId` (matches the canonical pattern of remounting the form on each
 * game switch so transient state — draft text, ratings — doesn't leak).
 */
export function DashboardQuickLogHero({
  username,
  playingGames,
}: DashboardQuickLogHeroProps) {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const isOpen = selectedGameId !== null;
  const hasGames = playingGames.length > 0;

  return (
    <>
      <section
        aria-label="Quick log session"
        className="border-border/40 bg-card/40 mb-6 rounded-lg border p-6"
      >
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              What did you play, {username}?
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Log tonight&apos;s session — playtime is enough, thoughts are
              optional.
            </p>
          </div>
          {!hasGames ? (
            <Button asChild variant="secondary" size="sm">
              <Link to="/library" search={{ status: "SHELF" }}>
                Find a game to start
              </Link>
            </Button>
          ) : null}
        </header>

        {hasGames ? (
          <ul
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            role="list"
          >
            {playingGames.map((game) => {
              const coverUrl = buildCoverImageUrl(
                game.coverImage,
                "t_cover_small"
              );
              return (
                <li
                  key={game.id}
                  className="border-border/40 bg-background/40 flex items-center gap-4 rounded-md border p-3"
                >
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={`Cover for ${game.title}`}
                      width={48}
                      height={64}
                      className="aspect-[3/4] h-16 w-12 shrink-0 overflow-hidden rounded-sm object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="bg-muted h-16 w-12 shrink-0 rounded-sm"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/games/$slug"
                      params={{ slug: game.slug }}
                      className="line-clamp-2 text-sm font-medium hover:underline"
                    >
                      {game.title}
                    </Link>
                    <div className="mt-2 flex flex-col items-start gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        className="h-7 px-2 text-xs"
                        onClick={() => setSelectedGameId(game.id)}
                      >
                        <Plus
                          className="mr-1 h-3 w-3"
                          aria-hidden="true"
                        />
                        Log Session
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-muted-foreground flex items-center gap-4 text-sm">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <p>
              Nothing in progress. Start something from the shelf and
              it&apos;ll show up here.
            </p>
          </div>
        )}
      </section>

      <ComposeJournalEntryDialog
        key={selectedGameId ?? "none"}
        open={isOpen}
        onOpenChange={(next) => {
          if (!next) setSelectedGameId(null);
        }}
        defaultGameId={selectedGameId ?? undefined}
      />
    </>
  );
}
