import Link from "next/link";

import { getWishlistedItems } from "@/features/view-wishlist/server-actions/get-wishlisted-items";
import { GridView } from "@/shared/components/grid-view";
import { Body, Heading } from "@/shared/components/typography";

export async function WishlistedList() {
  const { data: wishlistedItems, serverError } = await getWishlistedItems();

  if (serverError) {
    return (
      <Body variant="muted">
        Failed to load wishlist. Please try again later.
      </Body>
    );
  }

  if (!wishlistedItems || wishlistedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <Heading level={1} size="2xl">
          Your wishlist is empty
        </Heading>
        <Body variant="muted" className="mt-2">
          Start{" "}
          <Link
            href="/collection/add-game"
            className="font-semibold text-primary underline hover:no-underline"
          >
            adding
          </Link>{" "}
          games to your wishlist
        </Body>
      </div>
    );
  }

  return <GridView backlogItems={wishlistedItems} />;
}
