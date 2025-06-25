import { getServerUserId } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/card";
import { prisma } from "@/shared/lib/db";
import { Library, Star, Trophy } from "lucide-react";

export async function CollectionStats() {
  const userId = await getServerUserId();

  const [totalGames, completedGames, averageRating] = await Promise.all([
    prisma.backlogItem.count({
      where: { userId },
    }),
    prisma.backlogItem.count({
      where: {
        userId,
        status: "COMPLETED",
      },
    }),
    prisma.review.aggregate({
      where: { userId },
      _avg: { rating: true },
    }),
  ]);

  const completionRate =
    totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0;
  const avgRating = averageRating._avg.rating
    ? Math.round(averageRating._avg.rating * 10) / 10
    : 0;

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Library className="h-5 w-5" />
          Collection Stats
        </CardTitle>
        <CardDescription>Your gaming journey at a glance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Games</span>
          <span className="font-semibold">{totalGames}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">
              Completion Rate
            </span>
          </div>
          <span className="font-semibold">{completionRate}%</span>
        </div>
        {avgRating > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Avg Rating</span>
            </div>
            <span className="font-semibold">{avgRating}/10</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
