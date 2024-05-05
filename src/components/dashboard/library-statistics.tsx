import { DashboardItemLayout } from "@/src/components/dashboard/dashboard-item-layout";
import { Skeleton } from "@/src/components/ui/skeleton";
import { getCounts } from "@/src/queries/dashboard/get-counts";
import { BarChartBig, Gamepad, Library, Play } from "lucide-react";
import { Suspense } from "react";

async function Statistics() {
  const { backlog, playing, total } = await getCounts();

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
        <Play className="md:size-4" />
        <p>
          Playing right now <span className="font-medium">{playing}</span> games
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
