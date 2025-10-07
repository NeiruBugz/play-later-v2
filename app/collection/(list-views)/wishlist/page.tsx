import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { WishlistedList } from "@/features/view-wishlist/components";
import { GridSkeleton, ListSearchInput, Toolbar } from "@/shared/components";

export const dynamic = "force-dynamic";

export default async function WishlistPage(
  props: PageProps<"/collection/wishlist">
) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }
  const awaitedSearchParams = await props.searchParams;
  return (
    <div className="space-y-6">
      <Toolbar
        searchSlot={<ListSearchInput placeholder="Search wishlist..." />}
      />
      <Suspense fallback={<GridSkeleton count={12} />}>
        <WishlistedList params={awaitedSearchParams} />
      </Suspense>
    </div>
  );
}
