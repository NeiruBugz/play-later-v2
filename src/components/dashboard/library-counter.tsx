import { DashboardItemLayout } from "@/src/components/dashboard/dashboard-item-layout";
import { getCounts } from "@/src/queries/dashboard/get-counts";
import { BarChartBig, Gamepad, Library, Play } from "lucide-react";
import { Suspense } from "react";

export async function LibraryCounter() {
  const { backlog, playing, total } = await getCounts();

  return (
    <DashboardItemLayout
      heading={
        <>
          <BarChartBig className="size-4" />
          Your stats
        </>
      }
    >
      <Suspense fallback="Loading...">
        <div className="flex items-center gap-2">
          <Gamepad className="md:size-4" />
          <p>
            You logged <span className="font-medium">{total}</span> games
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
            Playing right now <span className="font-medium">{playing}</span>{" "}
            games
          </p>
        </div>
      </Suspense>
    </DashboardItemLayout>
  );
}
