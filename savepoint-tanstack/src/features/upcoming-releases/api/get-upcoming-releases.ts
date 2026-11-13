import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  getUpcomingReleasesWorker,
  type UpcomingReleasesData,
} from "./get-upcoming-releases.worker";

export const getUpcomingReleasesFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<UpcomingReleasesData> => {
  const userId = await requireUserId();
  return getUpcomingReleasesWorker(userId);
});

export type { UpcomingReleasesData } from "./get-upcoming-releases.worker";
