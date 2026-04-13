import type { LibraryPreviewGame } from "@/data-access-layer/services/profile/types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { GameCoverImage } from "@/shared/components/game-cover-image";

import { statusLabels } from "../lib/constants";
import type { ProfilePageLibraryStats } from "../use-cases/get-profile-page-data";
import { ProfileStatsBar } from "./profile-stats-bar";
import { RatingHistogram } from "./rating-histogram";

type OverviewTabProps = {
  stats: ProfilePageLibraryStats;
  libraryPreview: LibraryPreviewGame[];
  gameCount: number;
};

const LIBRARY_STATS_GRID_THRESHOLD = 10;

export function OverviewTab({
  stats,
  libraryPreview,
  gameCount,
}: OverviewTabProps) {
  const playing = stats.statusCounts.PLAYING ?? 0;
  const completed =
    stats.statusCounts.COMPLETED ?? stats.statusCounts.PLAYED ?? 0;
  const journalEntries = stats.journalCount;

  const showLibraryStatsGrid = gameCount >= LIBRARY_STATS_GRID_THRESHOLD;
  const showRecentlyPlayed = stats.recentGames.length > 0;
  const showLibraryPreview = libraryPreview.length > 0;

  const statusEntries = Object.entries(stats.statusCounts).filter(
    ([, count]) => count > 0
  );

  return (
    <div className="space-y-2xl">
      <ProfileStatsBar
        totalGames={gameCount}
        playing={playing}
        completed={completed}
        journalEntries={journalEntries}
      />

      <RatingHistogram
        ratingHistogram={stats.ratingHistogram}
        ratedCount={stats.ratedCount}
      />

      {showLibraryStatsGrid && (
        <div
          className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4"
          data-testid="overview-library-stats-grid"
        >
          {statusEntries.map(([status, count]) => {
            const percentage =
              gameCount > 0 ? Math.round((count / gameCount) * 100) : 0;
            const statusKey =
              status === "UP_NEXT" ? "upNext" : status.toLowerCase();
            return (
              <div key={status}>
                <p className="text-2xl font-bold tabular-nums">
                  {statusLabels[status] ?? status}
                </p>
                <p className="text-muted-foreground text-sm">
                  <span className="text-foreground font-semibold tabular-nums">
                    {count}
                  </span>{" "}
                  Games{" "}
                  <span
                    className="tabular-nums"
                    style={{ color: `var(--status-${statusKey})` }}
                  >
                    {percentage}%
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      )}

      {showRecentlyPlayed && (
        <section data-testid="overview-recently-played">
          <h2 className="heading-md mb-lg tracking-tight">Recently Played</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
            {stats.recentGames.map((game) => (
              <div
                key={game.gameId}
                className="group relative overflow-hidden rounded-lg"
                data-testid="overview-recently-played-entry"
              >
                <GameCoverImage
                  imageId={game.coverImage}
                  gameTitle={game.title}
                  size="cover_big"
                  className="aspect-[3/4] w-full"
                  sizes="(max-width: 640px) 30vw, 16vw"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-8">
                  <h3 className="line-clamp-2 text-sm font-semibold text-white drop-shadow-md">
                    {game.title}
                  </h3>
                  <p className="mt-1 text-xs text-white/60">
                    {formatDistanceToNow(new Date(game.lastPlayed), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showLibraryPreview && (
        <section data-testid="overview-library-preview">
          <h2 className="heading-md mb-lg tracking-tight">Library</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {libraryPreview.map((game) => (
              <Link
                key={game.slug}
                href={`/games/${game.slug}`}
                aria-label={game.title}
                className="group"
                data-testid="overview-library-preview-item"
              >
                <GameCoverImage
                  imageId={game.coverImage}
                  gameTitle={game.title}
                  size="cover_big"
                  className="aspect-[3/4] w-full rounded-md"
                  sizes="(max-width: 640px) 30vw, 16vw"
                />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export type { OverviewTabProps };
