import { DashboardItemLayout } from "@/src/components/dashboard/dashboard-item-layout";
import { ListSkeleton } from "@/src/components/dashboard/list-skeleton";
import { ReleasesList } from "@/src/components/dashboard/releases/list";
import { Clock } from "lucide-react";
import { Suspense } from "react";

export function UpcomingReleases() {
  return (
    <DashboardItemLayout
      heading={
        <>
          <Clock className="size-4" /> Upcoming releases from your wishlist
        </>
      }
    >
      <Suspense fallback={<ListSkeleton />}>
        <ReleasesList />
      </Suspense>
    </DashboardItemLayout>
  );
}
