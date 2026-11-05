import type { PublicUserRef } from "@/entities/follow/model";
import type { Profile } from "@/entities/profile/model/types";

export type UserConnectionsPageProps = {
  kind: "followers" | "following";
  profile: Profile;
  entries: ReadonlyArray<PublicUserRef>;
  total: number;
};
