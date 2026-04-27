import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { GenreBadges } from "@/widgets/game-card";
import {
  RelatedGames,
  RelatedGamesSkeleton,
} from "@/features/browse-related-games";
import {
  GameDescription,
  GameReleaseDate,
  JournalEntriesSection,
  PlaytimeSection,
} from "@/features/game-detail";
import { getGameDetails } from "@/features/game-detail/index.server";
import { GameDetailHero } from "@/features/game-detail/ui/game-detail-hero";
import { PlatformBadges } from "@/shared/components/platform-badges";
import { IMAGE_API, IMAGE_SIZES } from "@/shared/config/image.config";
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

  const bannerImageId = game.screenshots?.[0]?.image_id;
  const bannerUrl = bannerImageId
    ? `${IMAGE_API}/${IMAGE_SIZES["2x_full-hd"]}/${bannerImageId}.jpg`
    : null;

  const hasJournal = !!(userId && gameId);
  const hasPlaytime =
    !!(userId && gameId) ||
    !!(timesToBeat?.mainStory || timesToBeat?.completionist);
  const hasRelated = collections.length > 0;

  const totalMinutes = journalEntries.reduce(
    (sum, entry) =>
      sum +
      (entry.playedMinutes !== null && entry.playedMinutes !== undefined
        ? entry.playedMinutes
        : 0),
    0
  );
  const sessionCount = journalEntries.filter(
    (e) =>
      e.playedMinutes !== null &&
      e.playedMinutes !== undefined &&
      e.playedMinutes > 0
  ).length;

  return (
    <div className="pb-16">
      <GameDetailHero
        game={{
          ...game,
          genres: game.genres ?? [],
        }}
        gameId={gameId}
        bannerUrl={bannerUrl}
        userId={userId}
        userLibraryStatus={userLibraryStatus}
        hasJournal={hasJournal}
        hasPlaytime={hasPlaytime}
        hasRelated={hasRelated}
        journalEntryCount={hasJournal ? journalEntries.length : undefined}
      />

      <div
        className="mt-8 max-w-[880px] space-y-8 px-6 md:px-12"
        aria-label="Game information"
      >
        {/* Overview */}
        <section id="overview" aria-label="Game overview">
          <div
            className="mb-2 flex items-center gap-2 font-mono"
            aria-hidden="true"
          >
            <span className="text-caption text-muted-foreground tracking-wider uppercase">
              {"// GAME.DETAIL"}
            </span>
            <span className="bg-border h-px flex-1 opacity-50" />
            <span className="text-caption text-muted-foreground tracking-wider uppercase">
              {slug.slice(0, 12).toUpperCase()}
            </span>
          </div>

          <GameReleaseDate firstReleaseDate={game.first_release_date} />
          <GameDescription summary={game.summary} />

          {genres.length > 0 && (
            <div className="mt-5 flex items-baseline gap-3.5">
              <span className="text-caption text-muted-foreground min-w-[90px] font-mono tracking-wider uppercase">
                {"// Genres"}
              </span>
              <GenreBadges genres={genres} />
            </div>
          )}
          {platforms.length > 0 && (
            <div className="mt-1.5 flex items-baseline gap-3.5">
              <span className="text-caption text-muted-foreground min-w-[90px] font-mono tracking-wider uppercase">
                {"// Platforms"}
              </span>
              <PlatformBadges platforms={platforms} />
            </div>
          )}
        </section>

        {/* Playtime */}
        {hasPlaytime && (
          <PlaytimeSection
            totalMinutes={userId && gameId ? totalMinutes : 0}
            sessionCount={userId && gameId ? sessionCount : 0}
            timesToBeat={timesToBeat}
          />
        )}

        {/* Journal */}
        {userId && gameId && (
          <JournalEntriesSection
            journalEntries={journalEntries}
            gameId={gameId}
            gameTitle={game.name}
          />
        )}

        {/* Related */}
        {hasRelated && (
          <section id="related" aria-label="Related games">
            <Suspense fallback={<RelatedGamesSkeleton />}>
              <RelatedGames collections={collections} />
            </Suspense>
          </section>
        )}
        {!hasRelated && (
          <Suspense fallback={<RelatedGamesSkeleton />}>
            <RelatedGames collections={collections} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
