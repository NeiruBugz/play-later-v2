import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  getDashboardPageDataWorker,
  type DashboardPageData,
} from "./get-dashboard-page-data.worker";

export const getDashboardPageDataFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<DashboardPageData> => {
  const userId = await requireUserId();
  return getDashboardPageDataWorker(userId);
});

export type { DashboardPageData } from "./get-dashboard-page-data.worker";
