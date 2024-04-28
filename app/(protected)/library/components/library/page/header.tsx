import { LibraryHeaderProps } from "@/lib/types/library";

import { ClearFilters } from "@/app/(protected)/library/components/library/filters/clear-filters";
import { LibraryFiltersWrapper } from "@/app/(protected)/library/components/library/filters/filters";
import { LibraryNavigation } from "@/app/(protected)/library/components/library/navigation";
import { ViewModeToggle } from "@/app/(protected)/library/components/library/page/view-mode-toggle";
import { PickerDialog } from "@/app/(protected)/library/components/library/pick-random-game/picker-dialog";
import { countGamesPerStatus } from "@/app/(protected)/library/lib/actions/get-games";

export async function Header({
  currentStatus,
  backlogged,
}: LibraryHeaderProps) {
  const counts = await countGamesPerStatus();
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
          </div>
        </div>
        {currentStatus === "BACKLOG" && backlogged.length !== 0 ? (
          <PickerDialog items={backlogged} />
        ) : null}
      </section>
    </header>
  );
}
