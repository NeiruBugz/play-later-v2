import { LibraryGrid } from "@/entities/library-item/ui/library-grid";

import type { OverviewTabProps } from "./overview-tab.type";
import { ProfileStatsBar } from "../profile-stats-bar";

export function OverviewTab({ stats, gameCount }: OverviewTabProps) {
  const playing = stats.statusCounts.PLAYING ?? 0;
  const completed =
    stats.statusCounts.COMPLETED ?? stats.statusCounts.PLAYED ?? 0;

  const showRecentlyPlayed = stats.recentGames.length > 0;

  return (
    <div className="space-y-8">
      <ProfileStatsBar
        totalGames={gameCount}
        playing={playing}
        completed={completed}
        journalEntries={stats.journalCount}
      />

      {showRecentlyPlayed ? (
        <section data-testid="overview-recently-played">
          <h2 className="heading-md mb-4 tracking-tight">Recently Played</h2>
          <LibraryGrid
            games={stats.recentGames.map((game) => ({
              gameId: game.gameId,
              title: game.title,
              coverImage: game.coverImage,
            }))}
          />
        </section>
      ) : null}
    </div>
  );
}

export type { OverviewTabProps };
