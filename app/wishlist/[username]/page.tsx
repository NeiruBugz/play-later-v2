import { getUserByUsername } from "@/features/manage-user-info/server-actions/get-user-by-username";
import { getWishlistedItemsByUsername } from "@/features/view-wishlist/server-actions/get-wishlisted-items";
import { BacklogItemCard } from "@/shared/components/backlog-item-card";
import { Header } from "@/shared/components/header";
import { GenericPageProps } from "@/shared/types";

export default async function SharedWishlistPage(props: GenericPageProps) {
  const { username } = await props.params;
  const decodedUsername = decodeURIComponent(username);
  const [user, wishlistedItems] = await Promise.all([
    getUserByUsername(decodedUsername),
    getWishlistedItemsByUsername(decodedUsername),
  ]);

  return (
    <div>
      <Header />
      <div className="container overflow-hidden px-4 py-8 pt-[60px]">
        <div className="mb-8 mt-4 flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {user?.username || user?.name}&apos;s wishlist
          </h1>
        </div>
        <div>
          <ul className="flex flex-wrap justify-center gap-3 md:justify-start">
            {wishlistedItems.map(({ game, backlogItems }) => (
              <li key={game.id}>
                <BacklogItemCard
                  game={{
                    id: String(game.igdbId),
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
      </div>
    </div>
  );
}
