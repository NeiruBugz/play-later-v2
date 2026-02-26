import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  RelatedGames,
  RelatedGamesSkeleton,
} from "@/features/browse-related-games";
import { GameCoverImage } from "@/features/game-detail/ui/game-cover-image";
import { GameDescription } from "@/features/game-detail/ui/game-description";
import { GameReleaseDate } from "@/features/game-detail/ui/game-release-date";
import { JournalEntriesSection } from "@/features/game-detail/ui/journal-entries-section";
import { LibraryStatusDisplay } from "@/features/game-detail/ui/library-status-display";
import { QuickActionButtons } from "@/features/game-detail/ui/quick-action-buttons";
import { TimesToBeatSection } from "@/features/game-detail/ui/times-to-beat-section";
import { getGameDetails } from "@/features/game-detail/use-cases/get-game-details";
import { GenreBadges } from "@/shared/components/genre-badges";
import { PlatformBadges } from "@/shared/components/platform-badges";
import { getOptionalServerUserId } from "@/shared/lib/app/auth";

const IGDB_COVER_BASE_URL =
  "https://images.igdb.com/igdb/image/upload/t_cover_big";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getGameDetails({ slug });

  if (!result.success) {
    return { title: "Game | SavePoint" };
  }

  const { game } = result.data;
  const description = game.summary
    ? game.summary.slice(0, 160)
    : "Track, review, and manage your video game backlog on SavePoint.";
  const coverImageUrl = game.cover?.image_id
    ? `${IGDB_COVER_BASE_URL}/${game.cover.image_id}.jpg`
    : undefined;
  const images = coverImageUrl ? [{ url: coverImageUrl }] : undefined;

  return {
    title: `${game.name} | SavePoint`,
    description,
    alternates: { canonical: `/games/${slug}` },
    openGraph: {
      title: `${game.name} | SavePoint`,
      description,
      type: "website",
      ...(images && { images }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${game.name} | SavePoint`,
      description,
      ...(images && { images }),
    },
  };
}

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
  const { game, gameId, timesToBeat, userLibraryStatus, journalEntries } =
    result.data;
  const collections = (game.collections ?? []).sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "")
  );
  const platforms =
    game.platforms
      ?.map((p) => p.name)
      .filter((name): name is string => name !== undefined) ?? [];
  const genres =
    game.genres
      ?.map((g) => g.name)
      .filter((name): name is string => name !== undefined) ?? [];
  return (
    <div className="px-lg py-2xl md:px-2xl lg:px-3xl container mx-auto">
      <div className="gap-2xl lg:gap-3xl flex flex-col lg:grid lg:grid-cols-[minmax(280px,320px)_1fr]">
        <aside
          className="space-y-xl lg:top-3xl lg:sticky lg:self-start"
          aria-label="Game details sidebar"
        >
          <GameCoverImage
            imageId={game.cover?.image_id}
            gameTitle={game.name}
            libraryStatus={userLibraryStatus?.mostRecent.status}
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
        <main
          id="main-content"
          className="space-y-2xl"
          aria-label="Game information"
        >
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
          {userId && gameId && (
            <JournalEntriesSection
              journalEntries={journalEntries}
              gameId={gameId}
              gameTitle={game.name}
            />
          )}
          <Suspense fallback={<RelatedGamesSkeleton />}>
            <RelatedGames collections={collections} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
