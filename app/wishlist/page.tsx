import { auth } from "@/auth";
import { ShareWishlist } from "@/features/share-wishlist";
import { Header } from "@/shared/components/header";
import { WishlistedList } from "@/features/view-wishlist/components/wishlisted-list";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function WishlistPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 pt-[60px] md:px-6 lg:px-8">
        <div className="mb-2 flex justify-between">
          <h1 className="font-bold md:text-xl xl:text-2xl">Wishlist</h1>
          <ShareWishlist />
        </div>
        <Suspense fallback={"Loading..."}>
          <WishlistedList />
        </Suspense>
      </div>
    </>
  );
}
