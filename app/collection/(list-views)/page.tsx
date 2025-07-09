import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CollectionList } from "@/features/view-collection";
import { PlatformFilter } from "@/features/view-collection/components/platform-filter";
import { SearchInput } from "@/features/view-collection/components/search-input";
import { StatusFilter } from "@/features/view-collection/components/status-filter";
import { CollectionViewMode } from "@/features/view-collection/components/view-mode";
import { getUserUniquePlatforms } from "@/features/view-collection/server-actions/get-uniques-platforms";

export default async function CollectionPage(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const { data: uniquePlatforms } = await getUserUniquePlatforms();
  const awaitedSearchParams = await props.searchParams;

  return (
    <>
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <StatusFilter />
          <CollectionViewMode />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <SearchInput />
          </div>
          <div className="flex flex-wrap gap-2">
            <PlatformFilter platformOptions={uniquePlatforms || []} />
            {/* <CardViewMode /> */}
          </div>
        </div>
      </div>
      <Suspense fallback={"Loading..."}>
        <CollectionList params={awaitedSearchParams} />
      </Suspense>
    </>
  );
}
