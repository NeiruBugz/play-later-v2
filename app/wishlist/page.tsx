import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ShareWishlist } from "@/features/share-wishlist";
import { WishlistedList } from "@/features/view-wishlist/components/wishlisted-list";
import { Header } from "@/shared/components/header";
import { ResponsiveHeading } from "@/shared/components/typography";

export default async function WishlistPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }
  return (
    <>
      <Header />
      <div className="container overflow-hidden px-4 py-8 pt-[60px]">
        <div className="mb-8 mt-4 flex items-center justify-between">
          <ResponsiveHeading level={1}>Wishlist</ResponsiveHeading>
          <div className="flex justify-between">
            <ShareWishlist />
          </div>
        </div>
        <Suspense fallback={"Loading..."}>
          <WishlistedList />
        </Suspense>
      </div>
    </>
  );
}
