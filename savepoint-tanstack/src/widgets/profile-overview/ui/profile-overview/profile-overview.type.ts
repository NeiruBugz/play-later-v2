import type { ReactNode } from "react";

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
  /**
   * Follower / following counts. Optional — when omitted, the hero hides the
   * counts row entirely (used by tests / mocks). When supplied, the counts
   * render as `<Link>`s to `/u/$username/followers` and `/u/$username/following`.
   */
  followerCount?: number;
  followingCount?: number;
  /**
   * Header action slot — injected from the route. The route owns whether to
   * render the Follow/Unfollow button (feature component) or the own-profile
   * "Edit Profile" button. Kept as a slot so this widget stays free of
   * cross-feature imports (FSD: widgets compose features, but here the route
   * does the composition).
   */
  headerActions?: ReactNode;
  /**
   * Activity tab content slot. When omitted, an inline empty-state is shown
   * (preserves the slice-18 fallback for anonymous viewers / tests). When
   * supplied, replaces the static empty-state with the real activity feed.
   */
  activitySlot?: ReactNode;
  /**
   * Hide the Activity tab entirely. Used for anonymous viewers per locked
   * decision in spec 021 slice 20: anonymous viewers don't see the activity
   * tab on public profiles.
   */
  hideActivityTab?: boolean;
};
