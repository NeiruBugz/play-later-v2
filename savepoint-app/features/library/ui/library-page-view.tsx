import { LibraryFilters } from "@/features/library/ui/library-filters";
import { LibraryGrid } from "@/features/library/ui/library-grid";

export function LibraryPageView() {
  return (
    <div className="py-3xl container mx-auto">
      <h1 className="heading-xl mb-2xl">My Library</h1>
      <LibraryFilters />
      <LibraryGrid />
    </div>
  );
}
