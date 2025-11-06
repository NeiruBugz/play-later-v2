import { notFound } from "next/navigation";

import { GameCoverImage } from "@/features/game-detail/ui/game-cover-image";
import { GameDescription } from "@/features/game-detail/ui/game-description";
import { GameReleaseDate } from "@/features/game-detail/ui/game-release-date";
import { JournalEntriesSection } from "@/features/game-detail/ui/journal-entries-section";
import { LibraryStatusDisplay } from "@/features/game-detail/ui/library-status-display";
import { QuickActionButtons } from "@/features/game-detail/ui/quick-action-buttons";
import { RelatedGamesSection } from "@/features/game-detail/ui/related-games-section";
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

  const { game, timesToBeat, franchises, userLibraryStatus, journalEntries } =
    result.data;

  // Extract platform names from the platforms array
  const platforms =
    game.platforms
      ?.map((p) => p.name)
      .filter((name): name is string => name !== undefined) ?? [];

  // Extract genre names from the genres array
  const genres =
    game.genres
      ?.map((g) => g.name)
      .filter((name): name is string => name !== undefined) ?? [];

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[300px_1fr] lg:gap-8">
      {/* Sidebar - sticky on desktop */}
      <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
        <GameCoverImage imageId={game.cover?.image_id} gameTitle={game.name} />
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

      {/* Main content */}
      <main className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">{game.name}</h1>
          <GameReleaseDate firstReleaseDate={game.first_release_date} />
          {platforms.length > 0 && (
            <div className="pt-1">
              <PlatformBadges platforms={platforms} />
            </div>
          )}
          {genres.length > 0 && (
            <div className="pt-1">
              <GenreBadges genres={genres} />
            </div>
          )}
        </div>
        <GameDescription summary={game.summary} />
        <TimesToBeatSection timesToBeat={timesToBeat} />
        {userId && <JournalEntriesSection journalEntries={journalEntries} />}
        {franchises.length > 0 && (
          <RelatedGamesSection franchises={franchises} />
        )}
      </main>
    </div>
  );
}
