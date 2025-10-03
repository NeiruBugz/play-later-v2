import { formatDistanceToNow } from "date-fns";
import { Activity, Clock, Star } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { getRecentCompletedLibraryItems } from "../server-actions/get-recent-completed-backlog-items";
import { getRecentReviews } from "../server-actions/get-recent-reviews";

export async function RecentActivity() {
  const [recentlyCompleted, recentReviews] = await Promise.all([
    getRecentCompletedLibraryItems(),
    getRecentReviews(),
  ]);

  const hasActivity =
    (recentlyCompleted?.data?.length && recentlyCompleted?.data?.length > 0) ??
    (recentReviews?.data?.length && recentReviews?.data?.length > 0);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Activity className="size-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your latest gaming milestones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasActivity ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <>
            {recentlyCompleted.data?.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 p-1 dark:bg-green-900">
                  <Clock className="size-3 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    Experienced {item.game.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.completedAt &&
                      formatDistanceToNow(item.completedAt, {
                        addSuffix: true,
                      })}
                  </p>
                </div>
              </div>
            ))}
            {recentReviews.data?.map((review) => (
              <div key={review.id} className="flex items-start gap-3">
                <div className="rounded-full bg-yellow-100 p-1 dark:bg-yellow-900">
                  <Star className="size-3 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    Reviewed {review.Game.title} ({review.rating}/10)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(review.createdAt, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
