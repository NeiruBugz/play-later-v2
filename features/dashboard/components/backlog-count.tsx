import { LibraryItemStatus } from "@prisma/client";
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

import { getLibraryItemsCount } from "../server-actions/get-backlog-items-count";

export async function LibraryCount() {
  const [
    curiousAboutCountResult,
    totalGamesResult,
    experiencedGamesResult,
    recentlyAddedCountResult,
  ] = await Promise.all([
    getLibraryItemsCount({ status: LibraryItemStatus.CURIOUS_ABOUT }),
    getLibraryItemsCount({}),
    getLibraryItemsCount({ status: LibraryItemStatus.EXPERIENCED }),
    getLibraryItemsCount({
      status: LibraryItemStatus.CURIOUS_ABOUT,
      gteClause: {
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  const curiousAboutCount = curiousAboutCountResult.data ?? 0;
  const totalGames = totalGamesResult.data ?? 0;
  const experiencedGames = experiencedGamesResult.data ?? 0;
  const recentlyAddedCount = recentlyAddedCountResult.data ?? 0;

  const completionProgress =
    totalGames > 0 ? (experiencedGames / totalGames) * 100 : 0;
  const curiousAboutProgress =
    totalGames > 0 ? (curiousAboutCount / totalGames) * 100 : 0;

  const getMotivationalMessage = (count: number) => {
    if (count === 0) return "Your library is clear! Time to add some games.";
    if (count <= 5) return "A manageable list - you're doing great!";
    if (count <= 15) return "Getting serious about gaming!";
    if (count <= 30) return "Quite the collection building up!";
    return "Epic library - one game at a time!";
  };

  const getCuriousAboutColor = (count: number) => {
    if (count === 0) return "text-green-600 dark:text-green-400";
    if (count <= 10) return "text-blue-600 dark:text-blue-400";
    if (count <= 25) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getCuriousAboutBadgeColor = (count: number) => {
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
          <ListIcon className="size-5" />
          Games you&apos;re curious about
        </CardTitle>
        <CardDescription>
          {getMotivationalMessage(curiousAboutCount)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div
              className={`text-3xl font-bold ${getCuriousAboutColor(curiousAboutCount)}`}
            >
              {curiousAboutCount}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={getCuriousAboutBadgeColor(curiousAboutCount)}
              >
                {curiousAboutCount === 0
                  ? "Clear"
                  : `${Math.round(curiousAboutProgress)}% of collection`}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {experiencedGames > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Trophy className="size-3 text-yellow-500" />
                <span>{experiencedGames} experienced</span>
              </div>
            )}
            {recentlyAddedCount > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="size-3 text-green-500" />
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
                {Math.round(completionProgress)}% experienced
              </span>
            </div>
            <Progress value={completionProgress} className="h-2" />
          </div>
        )}

        {curiousAboutCount > 0 && (
          <div className="mt-4 rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" />
              <span>
                At 1 game per week, you&apos;ll explore them all in{" "}
                <span className="font-medium text-foreground">
                  {Math.ceil(curiousAboutCount / 1)} weeks
                </span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
