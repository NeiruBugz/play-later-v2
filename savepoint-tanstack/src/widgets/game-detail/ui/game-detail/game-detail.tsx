import { GameCover, GameMetadata } from "@/entities/game";
import { JournalTeaser } from "@/entities/journal-entry";
import { LibraryStatusStrip } from "@/entities/library-item";
import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { buildCoverImageUrl } from "@/entities/library-item/ui/library-item-card/library-item-card.utility";
import { AddFromGameDetailButton } from "@/features/add-game";
import { ManageFromGameDetailButton } from "@/features/manage-library-entry";

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

  return (
    <main className="gap-xl container mx-auto flex flex-col px-4 py-6">
      <section className="gap-xl flex flex-col md:flex-row">
        <div className="w-full max-w-xs shrink-0">
          <GameCover src={coverUrl} alt={game.title} />
        </div>
        <div className="gap-lg flex flex-1 flex-col">
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
          {timesToBeatSlot ?? null}
        </div>
      </section>

      {viewerUserId ? (
        <section
          aria-labelledby="journal-teaser-heading"
          className="gap-md flex flex-col"
        >
          <h2 id="journal-teaser-heading" className="text-h3">
            Journal
          </h2>
          <JournalTeaser entries={journalTeaser} />
        </section>
      ) : null}

      {relatedGamesSlot ?? null}
    </main>
  );
}
