import { OverviewTab } from "@/entities/profile/ui/overview-tab";
import { ProfileHeader } from "@/entities/profile/ui/profile-header";
// FSD: widgets may import features. ProfileOverview composes the upload
// affordance into the entity-level header via the entity's `avatarOverlay`
// slot — keeping ProfileHeader (entity) free of feature imports.
import { AvatarUpload } from "@/features/upload-avatar";

import type { ProfileOverviewProps } from "./profile-overview.type";

export function ProfileOverview({
  profile,
  stats,
  isOwnProfile = false,
}: ProfileOverviewProps) {
  const gameCount = Object.values(stats.statusCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="space-y-8">
      <ProfileHeader
        profile={profile}
        avatarOverlay={
          isOwnProfile ? <AvatarUpload label="Change avatar" /> : undefined
        }
      />
      <OverviewTab stats={stats} gameCount={gameCount} />
    </div>
  );
}
