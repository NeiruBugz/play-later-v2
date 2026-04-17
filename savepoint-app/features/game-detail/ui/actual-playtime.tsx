import { Timer } from "lucide-react";

import { Card } from "@/shared/components/ui/card";

interface ActualPlaytimeProps {
  totalMinutes: number;
  sessionCount: number;
}

function formatPlaytime(minutes: number): { value: string; unit: string } {
  if (minutes < 60) return { value: String(minutes), unit: "min" };
  const hours = minutes / 60;
  if (hours < 10) return { value: hours.toFixed(1), unit: "hours" };
  return { value: String(Math.round(hours)), unit: "hours" };
}

export function ActualPlaytime({
  totalMinutes,
  sessionCount,
}: ActualPlaytimeProps) {
  if (totalMinutes === 0) return null;

  const { value, unit } = formatPlaytime(totalMinutes);

  return (
    <Card className="p-lg gap-lg border-primary/30 bg-primary/5 flex items-center">
      <div className="bg-primary/15 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
        <Timer className="text-primary h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="body-sm text-muted-foreground">Your playtime</p>
        <p className="heading-lg font-semibold tabular-nums">
          {value}
          <span className="body-sm text-muted-foreground ml-xs font-sans">
            {unit}
          </span>
        </p>
      </div>
      <div className="text-muted-foreground body-sm text-right">
        {sessionCount} {sessionCount === 1 ? "session" : "sessions"}
      </div>
    </Card>
  );
}
