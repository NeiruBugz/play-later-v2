/**
 * Suspense fallback for `TimesToBeatSection`. Two shimmer rows with the
 * same vertical rhythm so the section header doesn't reflow on resolution.
 */
export function TimesToBeatSkeleton() {
  return (
    <section
      aria-labelledby="times-to-beat-heading-skeleton"
      aria-busy="true"
      className="gap-md flex flex-col"
    >
      <h2 id="times-to-beat-heading-skeleton" className="text-h3">
        Times to beat
      </h2>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="bg-muted h-4 w-24 animate-pulse rounded" />
        <dd className="bg-muted h-4 w-16 animate-pulse rounded" />
        <dt className="bg-muted h-4 w-28 animate-pulse rounded" />
        <dd className="bg-muted h-4 w-16 animate-pulse rounded" />
      </dl>
    </section>
  );
}
