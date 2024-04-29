import {
  countGamesPerStatus,
  getBackloggedGames,
} from "@/src/actions/library/get-games";
import { ClearFilters } from "@/src/components/library/library/filters/clear-filters";
import { LibraryFiltersWrapper } from "@/src/components/library/library/filters/filters";
import { LibraryNavigation } from "@/src/components/library/library/navigation";
import { ViewModeToggle } from "@/src/components/library/library/page/view-mode-toggle";
import { PickerDialog } from "@/src/components/library/library/pick-random-game/picker-dialog";


export async function Header() {
  const counts = await countGamesPerStatus();
  const backlogged = await getBackloggedGames();

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
        <PickerDialog items={backlogged ?? []} />
      </section>
    </header>
  );
}
