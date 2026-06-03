import type { CriticScoreRingProps } from "./critic-score-ring.type";

/**
 * Display-only circular indicator for a game's critic score (IGDB
 * aggregated_rating, 0-100). NEUTRAL styling — a catalog fact, not "you".
 * The filled arc uses --foreground; the remaining track is a faded
 * --muted-foreground. Hidden entirely when no score is available.
 *
 * The conic-gradient angle is data-driven and the fill/track colors are
 * token-based color-mix expressions, so it is expressed via inline style
 * with CSS custom properties rather than Tailwind utilities (no arbitrary
 * hex values are introduced).
 */
export function CriticScoreRing({ value }: CriticScoreRingProps) {
  if (value === null || value === undefined) {
    return null;
  }

  const rounded = Math.round(value);
  const degrees = Math.max(0, Math.min(100, rounded)) * 3.6;

  return (
    <div
      role="img"
      aria-label="Critic score"
      className="flex flex-col items-center gap-1.5"
    >
      <div
        className="relative size-[76px] shrink-0 rounded-full"
        style={{
          background: `conic-gradient(var(--foreground) ${degrees}deg, color-mix(in oklch, var(--muted-foreground) 20%, transparent) ${degrees}deg)`,
        }}
      >
        <div className="bg-card absolute inset-[7px] flex flex-col items-center justify-center rounded-full">
          <span className="text-foreground text-xl leading-none font-bold tabular-nums">
            {rounded}
          </span>
        </div>
      </div>
      <span className="text-caption text-muted-foreground tracking-wider uppercase">
        Critic score
      </span>
    </div>
  );
}
