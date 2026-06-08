import type { YourPacePanelProps } from "./your-pace-panel.type";

const MINUTES_PER_HOUR = 60;
const RECENT_BAR_LIMIT = 9;

function toHours(minutes: number): number {
  return Math.round(minutes / MINUTES_PER_HOUR);
}

function toAverageHours(totalMinutes: number, sessions: number): number {
  if (sessions <= 0) return 0;
  return Math.round((totalMinutes / sessions / MINUTES_PER_HOUR) * 10) / 10;
}

export function YourPacePanel({
  journalCount,
  playtimeTotalMinutes,
  playtimeSessionCount,
  recentSessionMinutes,
}: YourPacePanelProps) {
  const totalHours = toHours(playtimeTotalMinutes);
  const averageHours = toAverageHours(
    playtimeTotalMinutes,
    playtimeSessionCount
  );
  const recent = recentSessionMinutes.slice(-RECENT_BAR_LIMIT);
  const maxMinutes = Math.max(...recent, 1);

  return (
    <section
      aria-labelledby="your-pace-heading"
      className="gap-md flex flex-col"
    >
      <h2 id="your-pace-heading" className="text-h3">
        Your pace
      </h2>

      <div className="gap-lg flex">
        <PaceStat label="Avg session" value={`${averageHours}h`} />
        <PaceStat label="Total" value={`${totalHours}h`} />
        <PaceStat label="Sessions" value={String(journalCount)} />
      </div>

      {recent.length > 0 ? (
        <>
          <div className="flex h-20 items-end gap-1.5">
            {recent.map((minutes, index) => {
              const hours = toHours(minutes);
              return (
                <div
                  key={index}
                  role="img"
                  aria-label={`Session ${index + 1}: ${hours}h`}
                  className="bg-primary flex-1 rounded-sm"
                  style={{
                    height: `${Math.max(10, (minutes / maxMinutes) * 100)}%`,
                    opacity:
                      0.45 + 0.55 * (index / Math.max(1, recent.length - 1)),
                  }}
                />
              );
            })}
          </div>
          <div className="text-muted-foreground text-caption flex justify-between tracking-wider uppercase">
            <span>Earlier</span>
            <span>Latest</span>
          </div>
        </>
      ) : null}

      <p className="text-muted-foreground text-sm italic">
        No community time-to-beat estimate for this release yet — so here's your
        own rhythm instead.
      </p>
    </section>
  );
}

function PaceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1" role="group" aria-label={label}>
      <span className="text-muted-foreground text-caption tracking-wider uppercase">
        {label}
      </span>
      <span className="text-foreground font-mono text-xl font-bold tabular-nums">
        {value}
      </span>
    </div>
  );
}
