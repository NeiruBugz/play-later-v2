import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { WishlistedList } from "@/features/view-wishlist/components/wishlisted-list";

export default async function WishlistPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }
  return (
    <>
      <Suspense fallback={"Loading..."}>
        <WishlistedList />
      </Suspense>
    </>
  );
}
