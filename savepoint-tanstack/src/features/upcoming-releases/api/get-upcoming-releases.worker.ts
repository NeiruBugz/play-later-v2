import {
  getUpcomingReleases,
  type UpcomingRelease,
} from "@/entities/library-item/api/get-upcoming-releases.server";
import { toUtcCalendarDay } from "@/shared/lib/date";
import { UnauthorizedError } from "@/shared/lib/errors";

export type UpcomingReleasesData = { entries: UpcomingRelease[] };

export async function getUpcomingReleasesWorker(
  userId: string | undefined
): Promise<UpcomingReleasesData> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const entries = await getUpcomingReleases(
    userId,
    toUtcCalendarDay(new Date())
  );
  return { entries };
}
