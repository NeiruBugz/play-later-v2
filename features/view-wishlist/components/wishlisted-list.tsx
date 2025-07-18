import Link from "next/link";

import { getWishlistedItems } from "@/features/view-wishlist/server-actions/get-wishlisted-items";
import { BacklogItemCard } from "@/shared/components/backlog-item-card";

export async function WishlistedList() {
  const { data: wishlistedItems, serverError } = await getWishlistedItems();

  if (serverError) {
    return <div>{serverError}</div>;
  }

  if (!wishlistedItems || wishlistedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">Your wishlist is empty</h1>
        <p className="text-gray-500">
          Start{" "}
          <Link
            href="/collection/add-game"
            className="hover:font-bolder cursor-pointer font-bold underline"
          >
            adding
          </Link>{" "}
          games to your wishlist
        </p>
      </div>
    );
  }

  return (
    <div>
      <ul className="flex flex-wrap justify-center gap-3 md:justify-start">
        {wishlistedItems.map(({ game, backlogItems }) => (
          <li key={game.id}>
            <BacklogItemCard
              game={{
                id: game.id,
                title: game.title,
                coverImage: game.coverImage,
                igdbId: game.igdbId,
              }}
              backlogItems={backlogItems}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
