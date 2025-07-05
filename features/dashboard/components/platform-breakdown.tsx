import { getServerUserId } from "@/auth";
import { Monitor } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/card";
import { normalizeString } from "@/shared/lib";
import { prisma } from "@/shared/lib/db";

export async function PlatformBreakdown() {
  const userId = await getServerUserId();

  const [platformStats, acquisitionStats] = await Promise.all([
    prisma.backlogItem.groupBy({
      by: ["platform"],
      where: {
        userId,
        platform: { not: null },
      },
      _count: true,
      orderBy: {
        _count: {
          platform: "desc",
        },
      },
      take: 5,
    }),
    prisma.backlogItem.groupBy({
      by: ["acquisitionType"],
      where: { userId },
      _count: true,
    }),
  ]);

  const topPlatforms = platformStats.filter((stat) => stat.platform !== null);
  const acquisitionBreakdown = acquisitionStats.map((stat) => ({
    type: stat.acquisitionType,
    count: stat._count,
    percentage: Math.round(
      (stat._count / acquisitionStats.reduce((acc, s) => acc + s._count, 0)) *
        100
    ),
  }));

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Monitor className="h-5 w-5" />
          Platform & Format
        </CardTitle>
        <CardDescription>Your collection breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topPlatforms.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Top Platforms</h4>
            <div className="space-y-2">
              {topPlatforms.map((platform) => (
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

        {acquisitionBreakdown.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Acquisition Type</h4>
            <div className="space-y-2">
              {acquisitionBreakdown.map((acquisition) => (
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
