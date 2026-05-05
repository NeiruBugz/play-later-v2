import { OverviewTab } from "@/entities/profile/ui/overview-tab";
import { ProfileHeader } from "@/entities/profile/ui/profile-header";

import type { ProfileOverviewProps } from "./profile-overview.type";

export function ProfileOverview({ profile, stats }: ProfileOverviewProps) {
  const gameCount = Object.values(stats.statusCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="space-y-8">
      <ProfileHeader profile={profile} />
      <OverviewTab stats={stats} gameCount={gameCount} />
    </div>
  );
}
