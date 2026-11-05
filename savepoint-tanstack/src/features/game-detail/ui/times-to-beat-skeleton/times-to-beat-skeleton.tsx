import { SectionLabel } from "@/shared/ui/section-label";
import { Skeleton } from "@/shared/ui/skeleton";

/**
 * Suspense fallback for `TimesToBeatSection`. Two shimmer rows with the
 * same vertical rhythm so the section header doesn't reflow on resolution.
 */
export function TimesToBeatSkeleton() {
  return (
    <section
      aria-labelledby="times-to-beat-heading-skeleton"
      aria-busy="true"
      className="flex flex-col gap-2"
    >
      <SectionLabel id="times-to-beat-heading-skeleton">
        Times to beat
      </SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
    </section>
  );
}
