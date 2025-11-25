import { LibraryFilters } from "@/features/library/ui/library-filters";
import { LibraryGrid } from "@/features/library/ui/library-grid";
import { LibrarySortSelect } from "@/features/library/ui/library-sort-select";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const dynamic = "force-dynamic";
export default async function LibraryPage() {
  await requireServerUserId();
  return (
    <div className="container mx-auto py-3xl">
      <div className="mb-2xl flex flex-col gap-xl md:flex-row md:items-center md:justify-between">
        <h1 className="heading-xl">My Library</h1>
        <LibrarySortSelect />
      </div>
      <LibraryFilters />
      <LibraryGrid />
    </div>
  );
}
