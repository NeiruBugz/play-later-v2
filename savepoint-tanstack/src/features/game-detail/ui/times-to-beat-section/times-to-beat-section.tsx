import { YourPacePanel } from "@/features/game-detail/ui/your-pace-panel";

import type { TimesToBeatSectionProps } from "./times-to-beat-section.type";

const SECONDS_PER_HOUR = 3600;
const MINUTES_PER_HOUR = 60;

function secondsToHours(seconds: number): number {
  return Math.round((seconds / SECONDS_PER_HOUR) * 10) / 10;
}

function minutesToHours(minutes: number): number {
  return Math.round((minutes / MINUTES_PER_HOUR) * 10) / 10;
}

type BeatTick = { key: string; label: string; hours: number; anchor: string };

export function TimesToBeatSection({
  timesToBeat,
  playtimeTotalMinutes,
  journalCount,
  recentSessionMinutes,
}: TimesToBeatSectionProps) {
  if (timesToBeat === null) {
    return (
      <YourPacePanel
        journalCount={journalCount}
        playtimeTotalMinutes={playtimeTotalMinutes}
        recentSessionMinutes={recentSessionMinutes}
      />
    );
  }

  const youHours = minutesToHours(playtimeTotalMinutes);
  const mainHours =
    timesToBeat.mainStory === null
      ? null
      : secondsToHours(timesToBeat.mainStory);
  const compHours =
    timesToBeat.completionist === null
      ? null
      : secondsToHours(timesToBeat.completionist);

  const ticks: BeatTick[] = [];
  if (mainHours !== null) {
    ticks.push({
      key: "main",
      label: "Main story",
      hours: mainHours,
      anchor: "-50%",
    });
  }
  if (compHours !== null) {
    ticks.push({
      key: "completionist",
      label: "100%",
      hours: compHours,
      anchor: "-100%",
    });
  }

  const scaleMax = Math.max(youHours, compHours ?? 0, mainHours ?? 0, 1) * 1.1;
  const percent = (hours: number) =>
    `${Math.min(100, (hours / scaleMax) * 100)}%`;

  return (
    <section
      aria-labelledby="times-to-beat-heading"
      className="gap-md flex flex-col"
    >
      <h2 id="times-to-beat-heading" className="text-h3">
        Times to beat
      </h2>

      <div className="pt-6">
        <div className="relative h-24">
          <div
            className="absolute top-0 z-10 flex -translate-x-1/2 flex-col items-center"
            style={{ left: percent(youHours) }}
          >
            <span className="text-primary text-caption mb-1 tracking-wider whitespace-nowrap uppercase">
              You · {youHours}h
            </span>
            <span className="bg-primary ring-primary/20 h-3 w-3 rounded-full ring-4" />
          </div>

          <div className="bg-muted-foreground/15 absolute top-10 right-0 left-0 h-1.5 rounded-full" />
          <div
            className="bg-primary absolute top-10 left-0 h-1.5 rounded-full"
            style={{ width: percent(youHours) }}
          />
          <div
            className="bg-primary/55 absolute top-6 h-4 w-0.5 -translate-x-1/2"
            style={{ left: percent(youHours) }}
          />

          {ticks.map((tick) => (
            <div
              key={tick.key}
              className="absolute top-8 flex flex-col items-center"
              style={{
                left: percent(tick.hours),
                transform: `translateX(${tick.anchor})`,
              }}
            >
              <span className="bg-muted-foreground/45 h-4 w-0.5" />
              <span className="text-muted-foreground text-caption mt-1.5 tracking-wider whitespace-nowrap uppercase">
                {tick.label}
              </span>
              <span className="text-foreground font-mono text-xs font-semibold">
                {tick.hours}h
              </span>
            </div>
          ))}
        </div>
      </div>

      <p
        data-testid="times-to-beat-context"
        className="text-foreground text-sm"
      >
        <BeatContext
          youHours={youHours}
          mainHours={mainHours}
          compHours={compHours}
        />
      </p>
    </section>
  );
}

function BeatContext({
  youHours,
  mainHours,
  compHours,
}: {
  youHours: number;
  mainHours: number | null;
  compHours: number | null;
}) {
  if (mainHours !== null) {
    const delta = Math.round((youHours - mainHours) * 10) / 10;
    const direction = delta >= 0 ? "past" : "from";
    const remaining =
      compHours === null
        ? null
        : Math.max(0, Math.round((compHours - youHours) * 10) / 10);
    return (
      <>
        You're{" "}
        <strong className="text-primary">
          {Math.abs(delta)}h {direction}
        </strong>{" "}
        the main story
        {remaining === null
          ? "."
          : ` — about ${remaining}h of the long road left to 100%.`}
      </>
    );
  }

  if (compHours !== null) {
    const remaining = Math.max(0, Math.round((compHours - youHours) * 10) / 10);
    return (
      <>
        About <strong className="text-primary">{remaining}h</strong> left on the
        road to 100%.
      </>
    );
  }

  return null;
}
