import { getUserUniquePlatforms } from "@/src/features/filter/api";
import { ClearFilters } from "@/src/features/filter/ui/clear-filters";
import { PlatformFilter } from "@/src/features/filter/ui/platform-filter";
import { StatusFilter } from "@/src/features/filter/ui/status-filter";

export async function CollectionFilters() {
  const uniquePlatforms = await getUserUniquePlatforms();

  return (
    <div className="my-3 flex flex-wrap items-center justify-center md:flex-nowrap md:justify-between">
      <div className="my-4 flex flex-wrap justify-center gap-2 md:flex-nowrap">
        <PlatformFilter platformOptions={uniquePlatforms} />
        <StatusFilter />
      </div>
      <ClearFilters />
    </div>
  );
}
