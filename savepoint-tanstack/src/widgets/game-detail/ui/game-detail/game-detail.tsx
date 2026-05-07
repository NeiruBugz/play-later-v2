import { Link } from "@tanstack/react-router";

import { GameCover, GameMetadata } from "@/entities/game";
import { JournalTeaser } from "@/entities/journal-entry";
import { LibraryStatusStrip } from "@/entities/library-item";
import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { buildCoverImageUrl } from "@/entities/library-item/ui/library-item-card/library-item-card.utility";
import { AddFromGameDetailButton } from "@/features/add-game";
import { ManageFromGameDetailButton } from "@/features/manage-library-entry";
import { cn } from "@/shared/lib/utils";

import type { GameDetailProps } from "./game-detail.type";

/**
 * Game-detail page composition. Cover (left/top) + metadata (right/below);
 * library-status strip below metadata when the viewer has the game; CTA
 * (add-to-library / manage-in-library) for signed-in viewers; journal teaser
 * at the bottom for authenticated viewers only.
 *
 * Phase-2 sections (related games, times-to-beat) are passed as ReactNode
 * slots from the route. The route owns the `<Suspense>` + `<Await>` + error
 * boundary plumbing — keeps the widget pure and unit-testable.
 */
export function GameDetail({
  data,
  viewerUserId,
  relatedGamesSlot,
  timesToBeatSlot,
}: GameDetailProps) {
  const { game, libraryEntry, journalTeaser } = data;
  const coverUrl = buildCoverImageUrl(game.coverImage, "t_cover_big_2x");

  // The widget receives `libraryEntry` as a bare LibraryItem (no `game`
  // relation), but the LibraryModal requires a LibraryItemWithGame. We
  // synthesize the modal-facing shape locally from the orchestrator data —
  // both pieces are already on the loader payload. No second round-trip.
  const entryWithGame: LibraryItemWithGame | null =
    libraryEntry === null
      ? null
      : {
          ...libraryEntry,
          game: {
            id: game.id,
            igdbId: game.igdbId,
            title: game.title,
            slug: game.slug,
            coverImage: game.coverImage,
            releaseDate: game.releaseDate,
          },
        };

  const releaseYear = game.releaseDate
    ? game.releaseDate.getUTCFullYear().toString()
    : null;

  const tabs: Array<{ label: string; href: string; visible: boolean }> = [
    { label: "Overview", href: "#overview", visible: true },
    { label: "Journal", href: "#journal", visible: viewerUserId !== null },
    {
      label: "Related",
      href: "#related",
      visible: relatedGamesSlot !== null && relatedGamesSlot !== undefined,
    },
    {
      label: "Times to beat",
      href: "#times-to-beat",
      visible: timesToBeatSlot !== null && timesToBeatSlot !== undefined,
    },
  ];
  const visibleTabs = tabs.filter((t) => t.visible);

  return (
    <main className="container mx-auto flex flex-col px-4 py-6">
      <nav
        className="text-caption text-muted-foreground mb-md flex items-center gap-1.5"
        aria-label="Breadcrumb"
      >
        <Link to="/library" className="hover:text-foreground transition-colors">
          Library
        </Link>
        <span className="opacity-50">/</span>
        <span className="text-foreground max-w-[280px] truncate font-medium">
          {game.title}
        </span>
      </nav>

      <section id="overview" className="gap-xl mb-xl flex flex-col md:flex-row">
        <div className="w-full max-w-xs shrink-0">
          <GameCover src={coverUrl} alt={game.title} />
        </div>
        <div className="gap-lg flex flex-1 flex-col">
          {releaseYear ? (
            <p
              className="text-caption text-muted-foreground tracking-widest uppercase"
              aria-label="Release year"
            >
              {releaseYear}
            </p>
          ) : null}
          <GameMetadata
            title={game.title}
            releaseDate={game.releaseDate}
            summary={game.description}
          />
          {libraryEntry ? (
            <LibraryStatusStrip
              status={libraryEntry.status}
              rating={libraryEntry.rating}
              platform={libraryEntry.platform}
            />
          ) : null}
          {viewerUserId !== null ? (
            entryWithGame === null ? (
              <AddFromGameDetailButton
                igdbId={game.igdbId}
                gameTitle={game.title}
              />
            ) : (
              <ManageFromGameDetailButton entry={entryWithGame} />
            )
          ) : null}
        </div>
      </section>

      {visibleTabs.length > 1 ? (
        <nav
          aria-label="Game detail sections"
          className="border-border mb-lg border-b"
        >
          <ul className="flex gap-1 overflow-x-auto">
            {visibleTabs.map((tab, i) => (
              <li key={tab.label}>
                <a
                  href={tab.href}
                  className={cn(
                    "text-body inline-flex shrink-0 items-center gap-1.5 px-3.5 pt-3 pb-3 font-medium transition-colors",
                    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                    i === 0
                      ? "border-primary text-foreground -mb-px border-b-2 font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {timesToBeatSlot ? (
        <section id="times-to-beat">{timesToBeatSlot}</section>
      ) : null}

      {viewerUserId ? (
        <section
          id="journal"
          aria-labelledby="journal-teaser-heading"
          className="gap-md mt-lg flex flex-col"
        >
          <h2 id="journal-teaser-heading" className="text-h3">
            Journal
          </h2>
          <JournalTeaser entries={journalTeaser} />
        </section>
      ) : null}

      {relatedGamesSlot ? (
        <section id="related" className="mt-lg">
          {relatedGamesSlot}
        </section>
      ) : null}
    </main>
  );
}
