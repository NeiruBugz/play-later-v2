import { Clock, Trophy } from "lucide-react";

import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/ui";

import type { TimesToBeatSectionProps } from "./times-to-beat-section.types";

interface TimeCardProps {
  icon: React.ReactNode;
  label: string;
  hours: number | null | undefined;
  accentColor?: string;
}

function TimeCard({ icon, label, hours, accentColor }: TimeCardProps) {
  const hasTime = hours !== null && hours !== undefined;

  return (
    <Card className="p-lg relative overflow-hidden">
      <div className="gap-lg flex items-center">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            accentColor ? accentColor : "bg-muted"
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="body-sm text-muted-foreground">{label}</p>
          <p className="heading-md font-serif tabular-nums">
            {hasTime ? (
              <>
                {hours}
                <span className="body-sm text-muted-foreground ml-xs font-sans">
                  hours
                </span>
              </>
            ) : (
              <span className="text-muted-foreground/50">—</span>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function TimesToBeatSection({ timesToBeat }: TimesToBeatSectionProps) {
  const mainStory = timesToBeat?.mainStory;
  const completionist = timesToBeat?.completionist;

  if (!mainStory && !completionist) {
    return null;
  }

  return (
    <section
      className="animate-fade-in space-y-lg"
      aria-labelledby="times-to-beat-heading"
    >
      <h2 id="times-to-beat-heading" className="heading-md font-serif">
        Times to Beat
      </h2>
      <div className="gap-lg grid sm:grid-cols-2">
        <TimeCard
          icon={<Clock className="h-5 w-5 text-[var(--status-playing)]" />}
          label="Main Story"
          hours={mainStory}
          accentColor="bg-[var(--status-playing)]/10"
        />
        <TimeCard
          icon={<Trophy className="h-5 w-5 text-[var(--status-experienced)]" />}
          label="100% Completion"
          hours={completionist}
          accentColor="bg-[var(--status-experienced)]/10"
        />
      </div>
    </section>
  );
}
