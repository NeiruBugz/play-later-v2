import { BacklogItemStatus } from "@prisma/client";
import { Trophy } from "lucide-react";

import { getBacklogItemsCount } from "../../server-actions/get-backlog-items-count";

export async function CompletionRateCard() {
  const [totalGamesResult, completedGamesResult] = await Promise.all([
    getBacklogItemsCount({}),
    getBacklogItemsCount({
      status: BacklogItemStatus.COMPLETED,
    }),
  ]);

  const totalGames = totalGamesResult.data ?? 0;
  const completedGames = completedGamesResult.data ?? 0;

  const completionRate =
    totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0;

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">
          Completion Rate
        </div>
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold">{completionRate}%</div>
          <div className="text-primary">
            <Trophy className="size-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
