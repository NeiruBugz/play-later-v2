import { auth } from "@/auth";
import { LibraryStatistics } from "@/src/components/dashboard/library-statistics";
import { PlayingGames } from "@/src/components/dashboard/playing-games";
import { UpcomingEvents } from "@/src/components/dashboard/upcoming-events";
import { UpcomingReleases } from "@/src/components/dashboard/upcoming-releases";
import { LayoutHeader } from "@/src/components/ui/layout-header";
import { getUserData } from "@/src/queries/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const user = await getUserData();

  return (
    <div>
      <LayoutHeader heading={`Welcome back, ${user?.username ?? user?.name}`} />
      <section className="mt-4">
        <section className="container mt-2 flex max-w-[100vw] flex-col gap-3 md:flex-row">
          <UpcomingReleases />
          <LibraryStatistics />
          <PlayingGames />
        </section>
        <section className="container mt-2">
          <UpcomingEvents />
        </section>
      </section>
    </div>
  );
}
