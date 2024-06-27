import Link from "next/link";
import {
  BacklogItemCard,
  getWishlistedItems,
} from "@/src/entities/backlog-item";

export async function WishlistedList() {
  const wishlistedItems = await getWishlistedItems();

  if (!wishlistedItems || wishlistedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">Your wishlist is empty</h1>
        <p className="text-gray-500">
          Start{" "}
          <Link
            href="/collection/add-game"
            className="cursor-pointer font-bold hover:underline"
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
              }}
              backlogItems={backlogItems}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
