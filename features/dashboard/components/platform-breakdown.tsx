import { Monitor } from "lucide-react";

import { getPlatformBreakdown } from "@/features/dashboard/server-actions/get-platform-breakdown";
import { Body, Caption, Heading } from "@/shared/components/typography";
import { Progress } from "@/shared/components/ui/progress";
import { normalizeString } from "@/shared/lib";

export async function PlatformBreakdown() {
  const [platformStatsResult] = await Promise.all([getPlatformBreakdown()]);

  const totalGames =
    platformStatsResult?.data?.reduce(
      (sum, platform) => sum + platform._count,
      0
    ) || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Monitor className="size-5" />
        <Heading level={3} size="lg">
          Platform Breakdown
        </Heading>
      </div>

      {platformStatsResult?.data && platformStatsResult?.data?.length > 0 ? (
        <div className="space-y-3">
          {platformStatsResult?.data?.slice(0, 4).map((platform) => {
            const percentage =
              totalGames > 0
                ? Math.round((platform._count / totalGames) * 100)
                : 0;
            return (
              <div key={platform.platform} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Body size="sm" className="font-medium">
                    {normalizeString(platform.platform)}
                  </Body>
                  <Caption>{platform._count}</Caption>
                </div>
                <div className="space-y-1">
                  <Progress value={percentage} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Body size="sm" variant="muted">
          No platform data available.
        </Body>
      )}
    </div>
  );
}
