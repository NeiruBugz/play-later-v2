import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { GenreBadges } from "@/widgets/game-card";
import {
  RelatedGames,
  RelatedGamesSkeleton,
} from "@/features/browse-related-games";
import {
  GameCoverImage,
  GameDescription,
  GameReleaseDate,
  JournalEntriesSection,
  LibraryStatusDisplay,
  TimesToBeatSection,
} from "@/features/game-detail";
import { getGameDetails } from "@/features/game-detail/index.server";
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

  return (
    <div className="relative">
      {bannerUrl && (
        <div
          className="absolute inset-x-0 top-0 -z-10 h-[450px] overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 z-10"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, transparent 10%, color-mix(in srgb, var(--background) 60%, transparent) 50%, var(--background) 70%)",
            }}
          />
          <Image
            src={bannerUrl}
            alt=""
            fill
            className="object-cover object-top"
            priority
            sizes="100vw"
          />
        </div>
      )}

      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div
          className={`gap-y-lg flex flex-col lg:grid lg:grid-cols-[240px_1fr] lg:gap-x-10 ${bannerUrl ? "pt-[280px] sm:pt-[320px] lg:pt-[340px]" : "pt-8"}`}
        >
          <aside
            className="mx-auto w-full max-w-[280px] sm:max-w-[240px] lg:sticky lg:top-20 lg:mx-0 lg:max-w-none lg:self-start"
            aria-label="Game details sidebar"
          >
            <div className="space-y-xl jewel-corners jewel:p-2 jewel:rounded-lg">
              <GameCoverImage
                imageId={game.cover?.image_id}
                gameTitle={game.name}
                libraryStatus={userLibraryStatus?.mostRecent.status}
              />
              {userId && (
                <LibraryStatusDisplay
                  userLibraryStatus={userLibraryStatus}
                  igdbId={game.id}
                  gameTitle={game.name}
                />
              )}
            </div>
          </aside>

          <main
            id="main-content"
            className="space-y-2xl pb-3xl min-w-0"
            aria-label="Game information"
          >
            <header className="space-y-md">
              <div
                aria-hidden
                className="jewel:flex jewel-meta hidden items-center gap-3 opacity-60"
              >
                <span>{"// GAME.DETAIL"}</span>
                <span className="h-px flex-1 bg-[oklch(0.72_0.22_145/0.3)]" />
                <span>{slug.slice(0, 12).toUpperCase()}</span>
              </div>
              <h1 className="heading-xl lg:display-lg jewel-display jewel:tracking-[0.02em] tracking-tight">
                {game.name}
              </h1>
              <GameReleaseDate firstReleaseDate={game.first_release_date} />
              <GameDescription summary={game.summary} />
              {genres.length > 0 && (
                <div className="pt-sm flex items-baseline gap-3">
                  <span className="text-muted-foreground jewel-meta text-xs font-medium tracking-wider uppercase">
                    {"// Genres"}
                  </span>
                  <GenreBadges genres={genres} />
                </div>
              )}
              {platforms.length > 0 && (
                <div className="flex items-baseline gap-3">
                  <span className="text-muted-foreground jewel-meta text-xs font-medium tracking-wider uppercase">
                    {"// Platforms"}
                  </span>
                  <PlatformBadges platforms={platforms} />
                </div>
              )}
            </header>
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
    </div>
  );
}
