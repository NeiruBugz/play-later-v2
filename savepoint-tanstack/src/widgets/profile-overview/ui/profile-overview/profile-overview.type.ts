import type { LibraryStats } from "@/entities/library-item/api/get-library-stats.server";
import type { Profile } from "@/entities/profile/model/types";

export type ProfileOverviewProps = {
  profile: Profile;
  stats: LibraryStats;
};
