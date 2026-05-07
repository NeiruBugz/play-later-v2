/**
 * Suspense fallback for `RelatedGamesInfiniteList`. Mimics the grid shape
 * (5-up at lg) with shimmer placeholders. Pure CSS — no props, no logic.
 */
const PLACEHOLDER_COUNT = 10;

export function RelatedGamesSkeleton() {
  return (
    <section
      aria-labelledby="related-games-heading-skeleton"
      aria-busy="true"
      className="gap-md flex flex-col"
    >
      <h2 id="related-games-heading-skeleton" className="text-h3">
        Related games
      </h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
          <li key={index} className="flex flex-col gap-2">
            <div className="bg-muted aspect-[3/4] w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
          </li>
        ))}
      </ul>
    </section>
  );
}
