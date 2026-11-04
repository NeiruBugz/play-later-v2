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
    <Card variant="flat" className="gap-md p-xl flex flex-col">
      <section
        aria-labelledby="times-to-beat-heading"
        className="gap-md flex flex-col"
      >
        <h2 id="times-to-beat-heading" className="text-h3">
          Times to beat
        </h2>
        <dl className="gap-xl flex flex-wrap">
          {entries.map((entry) => (
            <div key={entry.label} className="flex flex-col">
              <dt className="text-muted-foreground text-caption tracking-wider uppercase">
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
