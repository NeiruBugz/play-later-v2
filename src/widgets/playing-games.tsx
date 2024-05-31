import { Play } from "lucide-react";
import { Suspense } from "react";

import { DashboardItemLayout } from "./dashboard-item-layout";
import { ListSkeleton } from "./list-skeleton";
// import { PlayingGamesList } from "@/src/components/dashboard/playing/list";

export function PlayingGames() {
  return (
    <DashboardItemLayout
      heading={
        <>
          <Play className="size-4" /> Playing now
        </>
      }
    >
      <Suspense fallback={<ListSkeleton length={2} />}>
        {/* <PlayingGamesList /> */}
      </Suspense>
    </DashboardItemLayout>
  );
}
