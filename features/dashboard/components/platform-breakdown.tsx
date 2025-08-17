import { Monitor } from "lucide-react";

import { getPlatformBreakdown } from "@/features/dashboard/server-actions/get-platform-breakdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { normalizeString } from "@/shared/lib";

import { getAcquisitionTypeBreakdown } from "../server-actions/get-acquisition-type-breakdown";

export async function PlatformBreakdown() {
  const [platformStatsResult, acquisitionStatsResult] = await Promise.all([
    getPlatformBreakdown(),
    getAcquisitionTypeBreakdown(),
  ]);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Monitor className="size-5" />
          Platform & Format
        </CardTitle>
        <CardDescription>Your collection breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {platformStatsResult?.data && platformStatsResult?.data?.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Top Platforms</h4>
            <div className="space-y-2">
              {platformStatsResult?.data?.map((platform) => (
                <div
                  key={platform.platform}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-muted-foreground">
                    {normalizeString(platform.platform)}
                  </span>
                  <span className="font-semibold">{platform._count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {acquisitionStatsResult?.data &&
          acquisitionStatsResult?.data?.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium">Acquisition Type</h4>
              <div className="space-y-2">
                {acquisitionStatsResult?.data?.map((acquisition) => (
                  <div
                    key={acquisition.type}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm capitalize text-muted-foreground">
                      {acquisition.type.toLowerCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {acquisition.percentage}%
                      </span>
                      <span className="font-semibold">{acquisition.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
