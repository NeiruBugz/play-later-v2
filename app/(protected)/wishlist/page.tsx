import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Wishlist } from "@/src/page-layer/wishlist";
import { getGamesFromWishlist } from "@/src/queries/wishlist/get-games-from-wishlist";

export default async function WishlistPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }
  const wishlist = await getGamesFromWishlist();
  return <Wishlist wishlist={wishlist} />;
}
