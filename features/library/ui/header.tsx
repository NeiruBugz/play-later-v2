import { LibraryFiltersWrapper } from "@/features/library/ui/filters/filters";
import { LibraryNavigation } from "@/features/library/ui/navigation";
import { PickerDialog } from "@/features/library/ui/pick-random-game/picker-dialog";

import { LibraryHeaderProps } from "@/types/library";

export function Header({ currentStatus, backlogged }: LibraryHeaderProps) {
  return (
    <header className="container sticky top-0 z-40 bg-background">
      <div className="flex flex-wrap justify-between">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
          Library
        </h1>
      </div>
      <section className="mt-4 flex flex-wrap items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <LibraryNavigation />
          <LibraryFiltersWrapper />
        </div>
        {currentStatus === "BACKLOG" && backlogged.length !== 0 ? (
          <PickerDialog items={backlogged} />
        ) : null}
      </section>
    </header>
  );
}
