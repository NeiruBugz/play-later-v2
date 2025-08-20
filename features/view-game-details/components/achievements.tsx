import { Clock, Trophy } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";

import {
  getUserAchievements,
  type EnrichedAchievement,
} from "@/features/steam-integration";
import { Body, Caption, Heading } from "@/shared/components/typography";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
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

  const getRarityBadgeVariant = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "outline";
      case "uncommon":
        return "secondary";
      case "rare":
        return "default";
      case "very_rare":
        return "primary";
      default:
        return "outline";
    }
  };

  return (
    <Card
      className={cn(
        "rounded-lg transition-all duration-200",
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
              <div className="bg-success absolute -right-1 -top-1 rounded-full p-1">
                <Trophy className="text-success-foreground size-3" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Body
                  size="sm"
                  className={cn(
                    "font-medium",
                    isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {achievement.displayName}
                </Body>
                <Caption className="mt-1">{achievement.description}</Caption>
              </div>

              <div className="flex flex-col gap-1">
                {achievement.globalPercent !== undefined && (
                  <Badge className="text-xs">
                    {achievement.globalPercent.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>

            {isUnlocked && achievement.unlocktime > 0 && (
              <Caption className="mt-2 flex items-center gap-1">
                <Clock className="size-3" />
                <span>
                  Unlocked{" "}
                  {new Date(achievement.unlocktime * 1000).toLocaleDateString()}
                </span>
              </Caption>
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
      <div className="py-8 text-center">
        <Trophy className="mx-auto mb-4 size-12 text-muted-foreground opacity-50" />
        <Body variant="muted">{serverError}</Body>
        {serverError === "Steam account not connected" && (
          <Body size="sm" variant="muted" className="mt-2">
            Connect your Steam account in settings to view achievements.
          </Body>
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
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy />
            Achievement Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <Body size="sm">Progress</Body>
                <Body size="sm">
                  {stats.unlocked}/{stats.total}
                </Body>
              </div>
              <Progress value={stats.completionPercentage} className="h-2" />
              <Caption className="mt-1">
                {stats.completionPercentage}% complete
              </Caption>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Heading size="xl" className="text-success">
                  {stats.unlocked}
                </Heading>
                <Caption>Unlocked</Caption>
              </div>
              <div>
                <Heading size="xl" className="text-muted-foreground">
                  {stats.total - stats.unlocked}
                </Heading>
                <Caption>Remaining</Caption>
              </div>
              <div>
                <Heading size="xl" className="text-info">
                  {stats.completionPercentage}%
                </Heading>
                <Caption>Complete</Caption>
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
      <div className="py-8 text-center">
        <Trophy className="mx-auto mb-4 size-12 text-muted-foreground opacity-50" />
        <Body variant="muted">No Steam App ID found for this game</Body>
        <Body size="sm" variant="muted" className="mt-2">
          Achievement data is not available for this game.
        </Body>
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
