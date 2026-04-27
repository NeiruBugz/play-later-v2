import { Clock, Timer, Trophy } from "lucide-react";

import { cn } from "@/shared/lib/ui/utils";

import type { TimesToBeatData } from "../types";

interface PlaytimeSectionProps {
  totalMinutes: number;
  sessionCount: number;
  timesToBeat?: TimesToBeatData;
}

function formatPlaytime(minutes: number): { value: string; unit: string } {
  if (minutes < 60) return { value: String(minutes), unit: "min" };
  const hours = minutes / 60;
  if (hours < 10) return { value: hours.toFixed(1), unit: "hours" };
  return { value: String(Math.round(hours)), unit: "hours" };
}

interface TimeCardProps {
  icon: React.ReactNode;
  label: string;
  hours: number | null | undefined;
  iconBg: string;
}

function TimeCard({ icon, label, hours, iconBg }: TimeCardProps) {
  const hasTime = hours !== null && hours !== undefined;

  return (
    <div className="bg-card border-border flex items-center gap-3.5 rounded-[10px] border p-[18px_20px]">
      <div
        className={cn(
          "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg",
          iconBg
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-caption text-muted-foreground mb-0.5">{label}</p>
        <p className="text-h3 tabular-nums">
          {hasTime ? (
            <>
              {hours}
              <span className="text-caption text-muted-foreground ml-1 font-normal">
                hours
              </span>
            </>
          ) : (
            <span className="text-muted-foreground/50">—</span>
          )}
        </p>
      </div>
    </div>
  );
}

export function PlaytimeSection({
  totalMinutes,
  sessionCount,
  timesToBeat,
}: PlaytimeSectionProps) {
  const hasPersonalPlaytime = totalMinutes > 0 || sessionCount > 0;
  const hasTimesToBeat = !!(
    timesToBeat?.mainStory || timesToBeat?.completionist
  );

  if (!hasPersonalPlaytime && !hasTimesToBeat) return null;

  const { value, unit } = formatPlaytime(totalMinutes);

  return (
    <section
      id="playtime"
      className="animate-fade-in"
      aria-labelledby="playtime-heading"
    >
      <h2 id="playtime-heading" className="text-h2 mb-4">
        Playtime
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {hasPersonalPlaytime && (
          <div className="bg-primary/[0.07] border-primary/25 col-span-2 flex items-center gap-3.5 rounded-[10px] border p-[18px_20px]">
            <div className="bg-primary/[0.12] text-primary flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg">
              <Timer className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-caption text-muted-foreground mb-0.5">
                Your playtime
              </p>
              <p className="text-h3 tabular-nums">
                {totalMinutes > 0 ? value : "0"}
                <span className="text-caption text-muted-foreground ml-1 font-normal">
                  {totalMinutes > 0 ? unit : "min"}
                </span>
              </p>
            </div>
            <div className="text-caption text-muted-foreground ml-auto">
              {sessionCount} {sessionCount === 1 ? "session" : "sessions"}
            </div>
          </div>
        )}
      </div>

      {hasTimesToBeat && (
        <>
          <p className="text-caption text-muted-foreground mt-4 mb-2 font-mono tracking-wider uppercase">
            {"// Average times to beat"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <TimeCard
              icon={
                <Clock className="h-[18px] w-[18px] text-[var(--status-playing)]" />
              }
              label="Main Story"
              hours={timesToBeat?.mainStory}
              iconBg="bg-[var(--status-playing)]/10"
            />
            <TimeCard
              icon={
                <Trophy className="h-[18px] w-[18px] text-[var(--status-played)]" />
              }
              label="100% Completion"
              hours={timesToBeat?.completionist}
              iconBg="bg-[var(--status-played)]/10"
            />
          </div>
        </>
      )}
    </section>
  );
}
