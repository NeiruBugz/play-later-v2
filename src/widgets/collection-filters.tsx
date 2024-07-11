import {
  ClearFilters,
  getUserUniquePlatforms,
  PlatformFilter,
  SearchInput,
  StatusFilter,
} from "@/src/features/filter";
import { Button } from "@/src/shared/ui";
import { Drawer, DrawerContent, DrawerTrigger } from "@/src/shared/ui/drawer";

export async function CollectionFilters() {
  const uniquePlatforms = await getUserUniquePlatforms();

  return (
    <>
      <div className="mb-3 hidden flex-wrap items-center justify-center md:flex md:flex-nowrap md:justify-between">
        <SearchInput />
        <div className="my-4 flex flex-wrap justify-center gap-2 md:flex-nowrap">
          <PlatformFilter platformOptions={uniquePlatforms} />
          <StatusFilter />
          <ClearFilters />
        </div>
      </div>
      <div className="flex items-center justify-between md:hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <Button className="my-2" variant="outline">
              Filters
            </Button>
          </DrawerTrigger>
          <DrawerContent className="py-4">
            <div className="my-3 flex flex-col flex-wrap items-center justify-center md:flex-nowrap md:justify-between">
              <SearchInput />
              <div className="my-4 flex flex-grow justify-center gap-2 md:flex-nowrap">
                <PlatformFilter platformOptions={uniquePlatforms} />
                <StatusFilter />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
        <ClearFilters />
      </div>
    </>
  );
}
