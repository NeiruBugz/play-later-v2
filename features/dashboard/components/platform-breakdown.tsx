import { Monitor } from "lucide-react";

import { getPlatformBreakdown } from "@/features/dashboard/server-actions/get-platform-breakdown";
import { Body, Caption, Heading } from "@/shared/components/typography";
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
          <Monitor />
          Platform & Format
        </CardTitle>
        <CardDescription>Your collection breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {platformStatsResult?.data && platformStatsResult?.data?.length > 0 && (
          <div>
            <Heading asChild className="mb-2">
              <h4>Top Platforms</h4>
            </Heading>
            <div className="space-y-2">
              {platformStatsResult?.data?.map((platform) => (
                <div
                  key={platform.platform}
                  className="flex items-center justify-between"
                >
                  <Body size="sm" variant="muted">
                    {normalizeString(platform.platform)}
                  </Body>
                  <Body size="sm" className="font-semibold">
                    {platform._count}
                  </Body>
                </div>
              ))}
            </div>
          </div>
        )}

        {acquisitionStatsResult?.data &&
          acquisitionStatsResult?.data?.length > 0 && (
            <div>
              <Heading asChild className="mb-2">
                <h4>Acquisition Type</h4>
              </Heading>
              <div className="space-y-2">
                {acquisitionStatsResult?.data?.map((acquisition) => (
                  <div
                    key={acquisition.type}
                    className="flex items-center justify-between"
                  >
                    <Body size="sm" variant="muted" className="capitalize">
                      {acquisition.type.toLowerCase()}
                    </Body>
                    <div className="flex items-center gap-2">
                      <Caption>{acquisition.percentage}%</Caption>
                      <Body size="sm" className="font-semibold">
                        {acquisition.count}
                      </Body>
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
