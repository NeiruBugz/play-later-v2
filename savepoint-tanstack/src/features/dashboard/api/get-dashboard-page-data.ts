import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  getDashboardPageDataWorker,
  type DashboardPageData,
} from "./get-dashboard-page-data.worker";

/**
 * Loader-friendly server fn for `/dashboard`. Lives in a non-`.server.ts` file
 * so the route loader can import it without tripping the Start route extractor
 * (foot-gun #2). Real work happens in the worker so integration tests can
 * drive it without the TanStack Start runtime (foot-gun #8).
 */
export const getDashboardPageDataFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<DashboardPageData> => {
  const userId = await requireUserId();
  return getDashboardPageDataWorker(userId);
});

export type { DashboardPageData } from "./get-dashboard-page-data.worker";
