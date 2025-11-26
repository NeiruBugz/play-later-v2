import {
  LibraryFilters,
  LibraryGrid,
  LibrarySortSelect,
} from "@/features/library/ui";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const dynamic = "force-dynamic";
export default async function LibraryPage() {
  await requireServerUserId();
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
