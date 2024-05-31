import { LayoutHeader } from "@/src/shared/ui/layout-header";

import { LibraryStatistics } from "@/src/widgets/library-statistics";
import { PlayingGames } from "@/src/widgets/playing-games";
import { ReviewsWidget } from "@/src/widgets/review-list";
import { UpcomingEvents } from "@/src/widgets/upcoming-events";
import { UpcomingReleases } from "@/src/widgets/upcoming-releases";

type DashboardPageProps = {
  username?: string;
};

export function Dashboard({ username }: DashboardPageProps) {
  return (
    <div>
      <LayoutHeader heading={`Welcome back, ${username}`} />
      <section className="container mt-4">
        <section className="mt-2 flex max-w-[100vw] flex-col justify-between gap-3 md:flex-row">
          <UpcomingReleases />
          <LibraryStatistics />
          <PlayingGames />
        </section>
        <ReviewsWidget />
        <section className="mt-2">
          <UpcomingEvents />
        </section>
      </section>
    </div>
  );
}
