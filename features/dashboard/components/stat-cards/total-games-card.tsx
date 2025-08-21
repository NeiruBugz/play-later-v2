import { Library } from "lucide-react";

import { getBacklogItemsCount } from "../../server-actions/get-backlog-items-count";

export async function TotalGamesCard() {
  const totalGamesResult = await getBacklogItemsCount({});
  const totalGames = totalGamesResult.data ?? 0;

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">
          Total Games
        </div>
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold">{totalGames}</div>
          <div className="text-primary">
            <Library className="size-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
