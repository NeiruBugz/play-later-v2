import type { LibraryStats } from "@/entities/library-item/api/get-library-stats.server";
import type { Profile } from "@/entities/profile/model/types";

export type ProfileOverviewProps = {
  profile: Profile;
  stats: LibraryStats;
  /**
   * When true, render the owner-only affordances on the profile:
   *   - "Change avatar" overlay on the avatar
   *   - "Edit Profile" button in the hero (linking to /settings/profile)
   *
   * Decided at the route layer (own-profile redirect target passes `true`
   * when the viewer matches the profile owner; otherwise `false`). Kept as
   * a primitive prop so the widget stays props-driven (FSD: widgets must
   * not infer routing/auth context themselves).
   */
  isOwnProfile?: boolean;
};
