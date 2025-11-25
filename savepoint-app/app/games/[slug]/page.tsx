import { notFound } from "next/navigation";
import { Suspense } from "react";

import { GameCoverImage } from "@/features/game-detail/ui/game-cover-image";
import { GameDescription } from "@/features/game-detail/ui/game-description";
import { GameReleaseDate } from "@/features/game-detail/ui/game-release-date";
import { JournalEntriesSection } from "@/features/game-detail/ui/journal-entries-section";
import { LibraryStatusDisplay } from "@/features/game-detail/ui/library-status-display";
import { QuickActionButtons } from "@/features/game-detail/ui/quick-action-buttons";
import {
  RelatedGamesServer,
  RelatedGamesSkeleton,
} from "@/features/game-detail/ui/related-games-section";
import { TimesToBeatSection } from "@/features/game-detail/ui/times-to-beat-section";
import { getGameDetails } from "@/features/game-detail/use-cases/get-game-details";
import { GenreBadges } from "@/shared/components/genre-badges";
import { PlatformBadges } from "@/shared/components/platform-badges";
import { getOptionalServerUserId } from "@/shared/lib/app/auth";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const userId = await getOptionalServerUserId();
  const result = await getGameDetails({ slug, userId: userId ?? undefined });
  if (!result.success) {
    notFound();
  }
  const { game, franchiseIds, timesToBeat, userLibraryStatus, journalEntries } =
    result.data;
  const platforms =
    game.platforms
      ?.map((p) => p.name)
      .filter((name): name is string => name !== undefined) ?? [];
  const genres =
    game.genres
      ?.map((g) => g.name)
      .filter((name): name is string => name !== undefined) ?? [];
  return (
    <div className="container mx-auto px-lg py-2xl md:px-2xl lg:px-3xl">
      <div className="flex flex-col gap-2xl lg:grid lg:grid-cols-[minmax(280px,320px)_1fr] lg:gap-3xl">
        {}
        <aside
          className="space-y-xl lg:sticky lg:top-3xl lg:self-start"
          aria-label="Game details sidebar"
        >
          <GameCoverImage
            imageId={game.cover?.image_id}
            gameTitle={game.name}
          />
          {userId && (
            <>
              <LibraryStatusDisplay
                userLibraryStatus={userLibraryStatus}
                igdbId={game.id}
                gameTitle={game.name}
              />
              <QuickActionButtons
                igdbId={game.id}
                gameTitle={game.name}
                currentStatus={userLibraryStatus?.mostRecent.status}
              />
            </>
          )}
        </aside>
        <main className="space-y-2xl" aria-label="Game information">
          <header className="space-y-md">
            <h1 className="display-lg">{game.name}</h1>
            <GameReleaseDate firstReleaseDate={game.first_release_date} />
            {platforms.length > 0 && (
              <div className="pt-xs">
                <PlatformBadges platforms={platforms} />
              </div>
            )}
            {genres.length > 0 && (
              <div className="pt-xs">
                <GenreBadges genres={genres} />
              </div>
            )}
          </header>
          <GameDescription summary={game.summary} />
          <TimesToBeatSection timesToBeat={timesToBeat} />
          {userId && <JournalEntriesSection journalEntries={journalEntries} />}
          <Suspense fallback={<RelatedGamesSkeleton />}>
            <RelatedGamesServer igdbId={game.id} franchiseIds={franchiseIds} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
