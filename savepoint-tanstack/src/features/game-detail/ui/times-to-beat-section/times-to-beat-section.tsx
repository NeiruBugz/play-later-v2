import { formatHours } from "@/shared/lib/date";
import { Card } from "@/shared/ui/card";
import { SectionLabel } from "@/shared/ui/section-label";

import type { TimesToBeatSectionProps } from "./times-to-beat-section.type";

const SECONDS_PER_MINUTE = 60;

export function TimesToBeatSection({
  timeToCreditsSeconds,
  timeToCompleteSeconds,
}: TimesToBeatSectionProps) {
  const entries = [
    { label: "Main story", seconds: timeToCreditsSeconds },
    { label: "100%", seconds: timeToCompleteSeconds },
  ].filter(
    (entry): entry is { label: string; seconds: number } =>
      entry.seconds !== null
  );

  if (entries.length === 0) return null;

  return (
    <Card variant="flat" className="flex flex-col gap-2 p-4">
      <section
        aria-labelledby="times-to-beat-heading"
        className="flex flex-col gap-2"
      >
        <SectionLabel id="times-to-beat-heading">Times to beat</SectionLabel>
        <dl className="flex flex-wrap gap-4">
          {entries.map((entry) => (
            <div key={entry.label} className="flex flex-col">
              <dt className="text-xs font-medium text-muted-foreground uppercase">
                {entry.label}
              </dt>
              <dd className="font-mono text-lg font-semibold text-foreground">
                {formatHours(entry.seconds / SECONDS_PER_MINUTE)}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </Card>
  );
}
