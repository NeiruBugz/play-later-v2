import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  refreshReleaseDatesWorker,
  type RefreshReleaseDatesResult,
} from "./refresh-release-dates.worker";

export const refreshReleaseDatesFn = createServerFn({
  method: "POST",
}).handler(async (): Promise<RefreshReleaseDatesResult> => {
  const userId = await requireUserId();
  return refreshReleaseDatesWorker(userId);
});

export type { RefreshReleaseDatesResult } from "./refresh-release-dates.worker";
