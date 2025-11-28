import { LibraryFilters } from "@/features/library/ui/library-filters";
import { LibraryGrid } from "@/features/library/ui/library-grid";
import { LibrarySortSelect } from "@/features/library/ui/library-sort-select";

export function LibraryPageView() {
  return (
    <div className="py-3xl container mx-auto">
      <div className="mb-2xl gap-xl flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="heading-xl">My Library</h1>
        <LibrarySortSelect />
      </div>
      <LibraryFilters />
      <LibraryGrid />
    </div>
  );
}
