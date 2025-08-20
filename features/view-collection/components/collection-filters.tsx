import { Button } from "@/shared/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/shared/components/ui/drawer";

import { getUserUniquePlatforms } from "../server-actions/get-uniques-platforms";
import { ClearFilters } from "./clear-filters";
import { PlatformFilter } from "./platform-filter";
import { SearchInput } from "./search-input";
import { StatusFilter } from "./status-filter";

export async function CollectionFilters() {
  const { data: uniquePlatforms } = await getUserUniquePlatforms();

  return (
    <>
      <div className="mb-3 flex w-full flex-wrap items-center justify-center md:flex-nowrap md:justify-between">
        <StatusFilter />
      </div>
      <div className="my-4 hidden flex-wrap gap-2 md:flex md:flex-nowrap">
        <PlatformFilter platformOptions={uniquePlatforms ?? []} />
        <SearchInput />
        <ClearFilters />
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
              <div className="my-4 flex grow justify-center gap-2 md:flex-nowrap">
                <PlatformFilter platformOptions={uniquePlatforms ?? []} />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
        <ClearFilters />
      </div>
    </>
  );
}
