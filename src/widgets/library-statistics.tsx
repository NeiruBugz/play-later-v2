import { BarChartBig, Gamepad, Library, ListChecks, Play } from "lucide-react";
import { Suspense } from "react";

import { Skeleton } from "@/src/shared/ui/skeleton";

import {
  getCompletedThisYearCount,
  getCounts,
} from "@/src/entities/game/api/get-counts";

import { DashboardItemLayout } from "./dashboard-item-layout";

async function Statistics() {
  const [{ backlog, total }, completed] = await Promise.all([
    getCounts(),
    getCompletedThisYearCount(),
  ]);

  return (
    <>
      <div className="flex items-center gap-2">
        <Gamepad className="md:size-4" />
        <p>
          You&apos;ve logged <span className="font-medium">{total}</span> games
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Library className="md:size-4" />
        <p>
          Currently in backlog <span className="font-medium">{backlog}</span>
          &nbsp;games
        </p>
      </div>
      <div className="flex items-center gap-2">
        <ListChecks className="md:size-4" />
        <p>
          Completed this year <span className="font-medium">{completed}</span>{" "}
          games
        </p>
      </div>
    </>
  );
}

const StatisticsSkeleton = () => (
  <>
    <div className="my-2 flex items-center gap-2">
      <Gamepad className="md:size-4" />
      <Skeleton className="h-[22px] w-full" />
    </div>
    <div className="my-2 flex items-center gap-2">
      <Library className="md:size-4" />
      <Skeleton className="h-[22px] w-full" />
    </div>
    <div className="my-2 flex items-center gap-2">
      <Play className="md:size-4" />
      <Skeleton className="h-[22px] w-full" />
    </div>
  </>
);

export function LibraryStatistics() {
  return (
    <DashboardItemLayout
      heading={
        <>
          <BarChartBig className="size-4" />
          Your stats
        </>
      }
    >
      <Suspense fallback={<StatisticsSkeleton />}>
        <Statistics />
      </Suspense>
    </DashboardItemLayout>
  );
}
