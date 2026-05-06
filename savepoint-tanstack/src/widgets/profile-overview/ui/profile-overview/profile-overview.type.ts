import type { LibraryStats } from "@/entities/library-item/api/get-library-stats.server";
import type { Profile } from "@/entities/profile/model/types";

export type ProfileOverviewProps = {
  profile: Profile;
  stats: LibraryStats;
  /**
   * When true, render the "Change avatar" upload overlay on the profile
   * header. Decided at the route layer (own-profile route passes `true`;
   * the public `/u/$username` route omits / passes `false`). Kept as a
   * primitive prop so the widget stays props-driven (FSD: widgets must
   * not infer routing/auth context themselves).
   */
  isOwnProfile?: boolean;
};
