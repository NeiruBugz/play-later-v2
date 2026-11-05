import { formatHours } from "@/shared/lib/date";
import { Card } from "@/shared/ui/card";

import type { TimesToBeatSectionProps } from "./times-to-beat-section.type";

const SECONDS_PER_MINUTE = 60;

export function TimesToBeatSection({ timesToBeat }: TimesToBeatSectionProps) {
  const entries = [
    { label: "Main story", seconds: timesToBeat?.mainStory ?? null },
    { label: "100%", seconds: timesToBeat?.completionist ?? null },
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
        <h2
          id="times-to-beat-heading"
          className="font-display text-2xl font-semibold tracking-tight"
        >
          Times to beat
        </h2>
        <dl className="flex flex-wrap gap-4">
          {entries.map((entry) => (
            <div key={entry.label} className="flex flex-col">
              <dt className="text-muted-foreground text-xs font-medium uppercase">
                {entry.label}
              </dt>
              <dd className="text-foreground font-mono text-lg font-semibold">
                {formatHours(entry.seconds / SECONDS_PER_MINUTE)}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </Card>
  );
}
