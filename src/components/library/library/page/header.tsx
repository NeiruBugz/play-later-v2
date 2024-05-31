import { ClearFilters } from "@/src/components/library/library/filters/clear-filters";
import { LibraryFiltersWrapper } from "@/src/components/library/library/filters/filters";
import { LibraryNavigation } from "@/src/components/library/library/navigation";
import { ViewModeToggle } from "@/src/components/library/library/page/view-mode-toggle";
import { PickerDialog } from "@/src/components/library/library/pick-random-game/picker-dialog";
import { getCountsAndBacklogList } from "@/src/entities/game/get-games";
import { Skeleton } from "@/src/shared/ui/skeleton";

export const HeaderSkeleton = () => (
  <header className="container sticky top-0 z-40 bg-background">
    <div className="flex flex-wrap justify-between">
      <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
        Library
      </h1>
    </div>
    <section className="mt-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex w-fit flex-wrap gap-2">
          <Skeleton className="h-8 w-[140px]" />
          <Skeleton className="h-8 w-[140px]" />
          <Skeleton className="h-8 w-[140px]" />
          <Skeleton className="h-8 w-[140px]" />
          <Skeleton className="h-8 w-[140px]" />
          <Skeleton className="h-8 w-[140px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="size-10" />
        </div>
      </div>
    </section>
  </header>
);

export async function Header() {
  const { backlogged, counts } = await getCountsAndBacklogList();

  return (
    <header className="container sticky top-0 z-40 bg-background">
      <div className="flex flex-wrap justify-between">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
          Library
        </h1>
      </div>
      <section className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <LibraryNavigation counts={counts} />
          <div className="flex gap-2">
            <LibraryFiltersWrapper />
            <ClearFilters />
            <ViewModeToggle />
            <PickerDialog items={backlogged ?? []} />
          </div>
        </div>
      </section>
    </header>
  );
}
