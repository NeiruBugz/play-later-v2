import { DashboardItemLayout } from "@/src/components/dashboard/dashboard-item-layout";
import { ListSkeleton } from "@/src/components/dashboard/list-skeleton";
import { PlayingGamesList } from "@/src/components/dashboard/playing/list";
import { Play } from "lucide-react";
import { Suspense } from "react";

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
        <PlayingGamesList />
      </Suspense>
    </DashboardItemLayout>
  );
}
