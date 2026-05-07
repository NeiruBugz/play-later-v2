import type { TimesToBeatSectionProps } from "./times-to-beat-section.type";

const SECONDS_PER_HOUR = 3600;

function formatHours(seconds: number | null): string {
  if (seconds === null) return "—";
  const hours = seconds / SECONDS_PER_HOUR;
  return `${(Math.round(hours * 10) / 10).toFixed(1)} h`;
}

/**
 * Minimal times-to-beat section (Slice 14 phase-2 rework).
 *
 * Two labeled rows: "Main story", "Completionist". No bar charts, no
 * completion strip, no community-average widget — full visual port lives
 * in Slice 18A.
 */
export function TimesToBeatSection({ timesToBeat }: TimesToBeatSectionProps) {
  return (
    <section
      aria-labelledby="times-to-beat-heading"
      className="gap-md flex flex-col"
    >
      <h2 id="times-to-beat-heading" className="text-h3">
        Times to beat
      </h2>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-muted-foreground">Main story</dt>
        <dd>{formatHours(timesToBeat.mainStory)}</dd>
        <dt className="text-muted-foreground">Completionist</dt>
        <dd>{formatHours(timesToBeat.completionist)}</dd>
      </dl>
    </section>
  );
}
