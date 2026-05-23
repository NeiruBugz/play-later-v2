import type { ReactNode } from "react";

import type { Profile } from "../../model/types";

export type ProfileHeaderProps = {
  profile: Profile;
  /**
   * Optional render slot positioned over the avatar. Used by the own-profile
   * route to inject a "Change avatar" upload affordance. Kept as a slot —
   * not a feature import — so this entity stays at the bottom of the FSD
   * dependency chain (entities cannot import features).
   */
  avatarOverlay?: ReactNode;
};
