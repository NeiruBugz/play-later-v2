import { Clock } from "lucide-react";
import { Suspense } from "react";

import { DashboardItemLayout } from "./dashboard-item-layout";
import { ListSkeleton } from "./list-skeleton";

export function UpcomingReleases() {
  return (
    <DashboardItemLayout
      heading={
        <>
          <Clock className="size-4" /> Upcoming releases from your wishlist
        </>
      }
    >
      <Suspense fallback={<ListSkeleton />}>{/* <ReleasesList /> */}</Suspense>
    </DashboardItemLayout>
  );
}
