import { Clock, Trophy } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";

import {
  getUserAchievements,
  type EnrichedAchievement,
} from "@/features/steam-integration";
import { Badge } from "@/shared/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/card";
import { Progress } from "@/shared/components/progress";
import { cn } from "@/shared/lib";

type AchievementsProps = {
  steamAppId?: number;
};

function AchievementCard({
  achievement,
}: {
  achievement: EnrichedAchievement;
}) {
  const isUnlocked = achievement.achieved === 1;
  const rarityColors = {
    common: "bg-gray-100 text-gray-800",
    uncommon: "bg-green-100 text-green-800",
    rare: "bg-blue-100 text-blue-800",
    very_rare: "bg-purple-100 text-purple-800",
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isUnlocked ? "bg-background" : "bg-muted/30"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <Image
              src={isUnlocked ? achievement.icon : achievement.icongray}
              alt={achievement.displayName}
              className={cn(
                "h-12 w-12 rounded-lg",
                !isUnlocked && "opacity-60 grayscale"
              )}
              width={48}
              height={48}
            />
            {isUnlocked && (
              <div className="absolute -right-1 -top-1 rounded-full bg-green-500 p-1">
                <Trophy className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4
                  className={cn(
                    "text-sm font-medium",
                    isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {achievement.displayName}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {achievement.description}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                {achievement.globalPercent !== undefined && (
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", rarityColors[achievement.rarity])}
                  >
                    {achievement.globalPercent.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>

            {isUnlocked && achievement.unlocktime > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  Unlocked{" "}
                  {new Date(achievement.unlocktime * 1000).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function AchievementsList({ steamAppId }: { steamAppId: number }) {
  const { serverError, validationErrors, data } = await getUserAchievements({
    steamAppId,
  });

  if (validationErrors) {
    console.log({ validationErrors });
  }

  if (serverError) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p>{serverError}</p>
        {serverError === "Steam account not connected" && (
          <p className="mt-2 text-sm">
            Connect your Steam account in settings to view achievements.
          </p>
        )}
      </div>
    );
  }

  if (!data) {
    return;
  }

  const { achievements, stats } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievement Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Progress</span>
                <span>
                  {stats.unlocked}/{stats.total}
                </span>
              </div>
              <Progress value={stats.completionPercentage} className="h-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.completionPercentage}% complete
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {stats.unlocked}
                </p>
                <p className="text-xs text-muted-foreground">Unlocked</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">
                  {stats.total - stats.unlocked}
                </p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.completionPercentage}%
                </p>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="h-[400px] space-y-3 overflow-y-auto">
        {achievements.map((achievement) => (
          <AchievementCard
            key={achievement.apiname}
            achievement={achievement}
          />
        ))}
      </div>
    </div>
  );
}

export function Achievements({ steamAppId }: AchievementsProps) {
  if (!steamAppId) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p>No Steam App ID found for this game</p>
        <p className="mt-2 text-sm">
          Achievement data is not available for this game.
        </p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      }
    >
      <AchievementsList steamAppId={steamAppId} />
    </Suspense>
  );
}
