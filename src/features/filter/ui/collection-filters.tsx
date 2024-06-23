import { getUserUniquePlatforms } from "@/src/features/filter/api";
import { PlatformFilter } from "@/src/features/filter/ui/platform-filter";
import { StatusFilter } from "@/src/features/filter/ui/status-filter";
import { ClearFilters } from "@/src/features/filter/ui/clear-filters";


export async function CollectionFilters() {
  const uniquePlatforms = await getUserUniquePlatforms();

  return (
    <div className="flex md:justify-between items-center justify-center flex-wrap md:flex-nowrap my-3">
      <div className="my-4 flex gap-2 flex-wrap md:flex-nowrap justify-center">
        <PlatformFilter platformOptions={uniquePlatforms}/>
        <StatusFilter/>
      </div>
      <ClearFilters/>
    </div>
  );
}
