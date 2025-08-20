import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CollectionList } from "@/features/view-collection";
import {
  CollectionViewMode,
  PlatformFilter,
  SearchInput,
  StatusFilter,
} from "@/features/view-collection/components";
import { getUserUniquePlatforms } from "@/features/view-collection/server-actions";

export default async function CollectionPage(props: PageProps<"/collection">) {
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
            <PlatformFilter platformOptions={uniquePlatforms ?? []} />
          </div>
        </div>
      </div>
      <Suspense fallback={"Loading..."}>
        <CollectionList params={awaitedSearchParams} />
      </Suspense>
    </>
  );
}
