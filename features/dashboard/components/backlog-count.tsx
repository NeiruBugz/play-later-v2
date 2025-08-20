import { BacklogItemStatus } from "@prisma/client";
import { CalendarDays, ListIcon, TrendingUp, Trophy } from "lucide-react";

import { Body, Caption, Heading } from "@/shared/components/typography";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";

import { getBacklogItemsCount } from "../server-actions/get-backlog-items-count";

export async function BacklogCount() {
  const [
    backlogCountResult,
    totalGamesResult,
    completedGamesResult,
    recentlyAddedCountResult,
  ] = await Promise.all([
    getBacklogItemsCount({ status: BacklogItemStatus.TO_PLAY }),
    getBacklogItemsCount({}),
    getBacklogItemsCount({ status: BacklogItemStatus.COMPLETED }),
    getBacklogItemsCount({
      status: BacklogItemStatus.TO_PLAY,
      gteClause: {
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  const backlogCount = backlogCountResult.data ?? 0;
  const totalGames = totalGamesResult.data ?? 0;
  const completedGames = completedGamesResult.data ?? 0;
  const recentlyAddedCount = recentlyAddedCountResult.data ?? 0;

  const completionProgress =
    totalGames > 0 ? (completedGames / totalGames) * 100 : 0;

  const getMotivationalMessage = (count: number) => {
    if (count === 0) return "Your backlog is clear! Time to add some games.";
    if (count <= 10) return "A manageable backlog. You're doing great!";
    if (count <= 25) return "Quite the collection building up!";
    return "One game at a time. You can do it!";
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListIcon />
          Backlog
        </CardTitle>
        <CardDescription>
          {getMotivationalMessage(backlogCount)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <Heading asChild size="2xl">
            <h2>{backlogCount}</h2>
          </Heading>
          <div className="flex items-center gap-2">
            {recentlyAddedCount > 0 && (
              <Caption className="flex items-center gap-1">
                <TrendingUp className="size-4 text-green-500" />+
                {recentlyAddedCount} this week
              </Caption>
            )}
            {completedGames > 0 && (
              <Caption className="flex items-center gap-1">
                <Trophy className="size-4 text-yellow-500" />
                {completedGames} completed
              </Caption>
            )}
          </div>
        </div>

        {totalGames > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Caption>Completion</Caption>
              <Body size="sm" className="font-medium">
                {Math.round(completionProgress)}%
              </Body>
            </div>
            <Progress value={completionProgress} className="h-2" />
          </div>
        )}

        {backlogCount > 0 && (
          <div className="mt-4 rounded-lg bg-muted p-3">
            <Caption className="flex items-center gap-2">
              <CalendarDays />
              At 1 game/week, you&apos;ll clear this in{" "}
              <span className="font-medium text-foreground">
                {Math.ceil(backlogCount / 1)} weeks
              </span>
            </Caption>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
