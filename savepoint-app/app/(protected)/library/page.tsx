import { LibraryFilters } from "@/features/library/ui/library-filters";
import { LibraryGrid } from "@/features/library/ui/library-grid";
import { LibrarySortSelect } from "@/features/library/ui/library-sort-select";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  await requireServerUserId();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">My Library</h1>
        <LibrarySortSelect />
      </div>
      <LibraryFilters />
      <LibraryGrid />
    </div>
  );
}
