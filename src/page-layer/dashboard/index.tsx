import { LibraryStatistics } from "@/src/components/dashboard/library-statistics";
import { PlayingGames } from "@/src/components/dashboard/playing-games";
import { ReviewsWidget } from "@/src/components/dashboard/reviews/review-list";
import { UpcomingEvents } from "@/src/components/dashboard/upcoming-events";
import { UpcomingReleases } from "@/src/components/dashboard/upcoming-releases";
import { LayoutHeader } from "@/src/shared/ui/layout-header";

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
