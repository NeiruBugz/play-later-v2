import { SectionLabel } from "@/shared/ui/section-label";
import { Skeleton } from "@/shared/ui/skeleton";

/**
 * Suspense fallback for `RelatedGamesTabs`. Mimics the grid shape
 * (5-up at lg) with shimmer placeholders. Pure CSS — no props, no logic.
 */
const PLACEHOLDER_COUNT = 10;

export function RelatedGamesSkeleton() {
  return (
    <section
      aria-labelledby="related-games-heading-skeleton"
      aria-busy="true"
      className="flex flex-col gap-2"
    >
      <SectionLabel id="related-games-heading-skeleton">
        Related games
      </SectionLabel>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
          <li key={index} className="flex flex-col gap-2">
            <Skeleton className="aspect-[3/4] w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
          </li>
        ))}
      </ul>
    </section>
  );
}
