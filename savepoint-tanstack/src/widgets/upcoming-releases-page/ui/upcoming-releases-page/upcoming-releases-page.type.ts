import type { UpcomingReleasesData } from "@/features/upcoming-releases";

export type UpcomingReleasesPageEntry = UpcomingReleasesData["entries"][number];

export type UpcomingReleasesPageProps = {
  entries: UpcomingReleasesPageEntry[];
};
