import { BacklogItemStatus } from "@prisma/client";
import { CalendarDays, ListIcon, TrendingUp, Trophy } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
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
  const backlogProgress =
    totalGames > 0 ? (backlogCount / totalGames) * 100 : 0;

  const getMotivationalMessage = (count: number) => {
    if (count === 0) return "Your backlog is clear! Time to add some games.";
    if (count <= 5) return "A manageable backlog - you're doing great!";
    if (count <= 15) return "Getting serious about gaming!";
    if (count <= 30) return "Quite the collection building up!";
    return "Epic backlog - one game at a time!";
  };

  const getBacklogColor = (count: number) => {
    if (count === 0) return "text-green-600 dark:text-green-400";
    if (count <= 10) return "text-blue-600 dark:text-blue-400";
    if (count <= 25) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getBacklogBadgeColor = (count: number) => {
    if (count === 0)
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (count <= 10)
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    if (count <= 25)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <ListIcon className="h-5 w-5" />
          Games in backlog
        </CardTitle>
        <CardDescription>
          {getMotivationalMessage(backlogCount)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div
              className={`text-3xl font-bold ${getBacklogColor(backlogCount)}`}
            >
              {backlogCount}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={getBacklogBadgeColor(backlogCount)}
              >
                {backlogCount === 0
                  ? "Clear"
                  : `${Math.round(backlogProgress)}% of collection`}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {completedGames > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Trophy className="h-3 w-3 text-yellow-500" />
                <span>{completedGames} completed</span>
              </div>
            )}
            {recentlyAddedCount > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span>+{recentlyAddedCount} this week</span>
              </div>
            )}
          </div>
        </div>

        {totalGames > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {Math.round(completionProgress)}% complete
              </span>
            </div>
            <Progress value={completionProgress} className="h-2" />
          </div>
        )}

        {backlogCount > 0 && (
          <div className="mt-4 rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                At 1 game per week, you&apos;ll clear your backlog in{" "}
                <span className="font-medium text-foreground">
                  {Math.ceil(backlogCount / 1)} weeks
                </span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
