import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CollectionList } from "@/features/view-collection";
import {
  PlatformFilter,
  SearchInput,
  StatusFilter,
} from "@/features/view-collection/components";
import { getUserUniquePlatforms } from "@/features/view-collection/server-actions";
import { Toolbar } from "@/shared/components/list/toolbar";

export const dynamic = "force-dynamic";

export default async function CollectionPage(props: PageProps<"/collection">) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const { data: uniquePlatforms } = await getUserUniquePlatforms();
  const awaitedSearchParams = await props.searchParams;

  return (
    <div className="space-y-6">
      <Toolbar
        searchSlot={<SearchInput />}
        filtersPanel={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <StatusFilter />
            </div>
            <div className="flex-1">
              <PlatformFilter platformOptions={uniquePlatforms ?? []} />
            </div>
          </div>
        }
      />
      <Suspense fallback={"Loading..."}>
        <CollectionList params={awaitedSearchParams} />
      </Suspense>
    </div>
  );
}
