import { Trophy } from "lucide-react";

type AchievementsProps = {
  steamAppId?: number;
};

export function Achievements({ steamAppId }: AchievementsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <h3 className="font-medium">Achievement Progress</h3>
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-amber-500" />
        </div>
      </div>
    </div>
  );
}
