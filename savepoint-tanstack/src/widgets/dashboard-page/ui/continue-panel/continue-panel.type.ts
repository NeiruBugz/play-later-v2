import type { DashboardPageData } from "@/features/dashboard";

export type ContinuePanelProps = {
  playing: DashboardPageData["playing"];
  upNextQueue: DashboardPageData["upNextQueue"];
};
