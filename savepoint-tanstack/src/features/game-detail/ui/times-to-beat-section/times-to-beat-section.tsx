import { YourPacePanel } from "@/features/game-detail/ui/your-pace-panel";
import { formatHours } from "@/shared/lib/date";

import type { TimesToBeatSectionProps } from "./times-to-beat-section.type";

const SECONDS_PER_MINUTE = 60;

function secondsToMinutes(seconds: number): number {
  return seconds / SECONDS_PER_MINUTE;
}

type BeatTick = { key: string; label: string; minutes: number; anchor: string };

export function TimesToBeatSection({
  timesToBeat,
  playtimeTotalMinutes,
  playtimeSessionCount,
  recentSessionMinutes,
}: TimesToBeatSectionProps) {
  if (timesToBeat === null) {
    return (
      <YourPacePanel
        playtimeTotalMinutes={playtimeTotalMinutes}
        playtimeSessionCount={playtimeSessionCount}
        recentSessionMinutes={recentSessionMinutes}
      />
    );
  }

  const youMinutes = playtimeTotalMinutes;
  const mainMinutes =
    timesToBeat.mainStory === null
      ? null
      : secondsToMinutes(timesToBeat.mainStory);
  const compMinutes =
    timesToBeat.completionist === null
      ? null
      : secondsToMinutes(timesToBeat.completionist);

  const ticks: BeatTick[] = [];
  if (mainMinutes !== null) {
    ticks.push({
      key: "main",
      label: "Main story",
      minutes: mainMinutes,
      anchor: "-50%",
    });
  }
  if (compMinutes !== null) {
    ticks.push({
      key: "completionist",
      label: "100%",
      minutes: compMinutes,
      anchor: "-100%",
    });
  }

  const scaleMax =
    Math.max(youMinutes, compMinutes ?? 0, mainMinutes ?? 0, 1) * 1.1;
  const percent = (minutes: number) =>
    `${Math.min(100, (minutes / scaleMax) * 100)}%`;

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
            style={{ left: percent(youMinutes) }}
          >
            <span className="text-primary text-caption mb-1 tracking-wider whitespace-nowrap uppercase">
              You · {formatHours(youMinutes)}
            </span>
            <span className="bg-primary ring-primary/20 h-3 w-3 rounded-full ring-4" />
          </div>

          <div className="bg-muted-foreground/15 absolute top-10 right-0 left-0 h-1.5 rounded-full" />
          <div
            className="bg-primary absolute top-10 left-0 h-1.5 rounded-full"
            style={{ width: percent(youMinutes) }}
          />
          <div
            className="bg-primary/55 absolute top-6 h-4 w-0.5 -translate-x-1/2"
            style={{ left: percent(youMinutes) }}
          />

          {ticks.map((tick) => (
            <div
              key={tick.key}
              className="absolute top-8 flex flex-col items-center"
              style={{
                left: percent(tick.minutes),
                transform: `translateX(${tick.anchor})`,
              }}
            >
              <span className="bg-muted-foreground/45 h-4 w-0.5" />
              <span className="text-muted-foreground text-caption mt-1.5 tracking-wider whitespace-nowrap uppercase">
                {tick.label}
              </span>
              <span className="text-foreground font-mono text-xs font-semibold">
                {formatHours(tick.minutes)}
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
          youMinutes={youMinutes}
          mainMinutes={mainMinutes}
          compMinutes={compMinutes}
        />
      </p>
    </section>
  );
}

function BeatContext({
  youMinutes,
  mainMinutes,
  compMinutes,
}: {
  youMinutes: number;
  mainMinutes: number | null;
  compMinutes: number | null;
}) {
  if (mainMinutes !== null) {
    const delta = youMinutes - mainMinutes;
    const direction = delta >= 0 ? "past" : "from";
    const remaining =
      compMinutes === null ? null : Math.max(0, compMinutes - youMinutes);
    return (
      <>
        You're{" "}
        <strong className="text-primary">
          {formatHours(Math.abs(delta))} {direction}
        </strong>{" "}
        the main story
        {remaining === null
          ? "."
          : ` — about ${formatHours(remaining)} of the long road left to 100%.`}
      </>
    );
  }

  if (compMinutes !== null) {
    const remaining = Math.max(0, compMinutes - youMinutes);
    return (
      <>
        About <strong className="text-primary">{formatHours(remaining)}</strong>{" "}
        left on the road to 100%.
      </>
    );
  }

  return null;
}
