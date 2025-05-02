import { getUserInfo } from "@/features/manage-user-info/server-actions/get-user-info";
import { getWishlistedItems } from "@/features/view-wishlist/server-actions/get-wishlisted-items";
import { BacklogItemCard } from "@/shared/components/backlog-item-card";
import { Header } from "@/shared/components/header";
import { GenericPageProps } from "@/shared/types";

export default async function SharedWishlistPage(props: GenericPageProps) {
  const [user, wishlistedItems] = await Promise.all([
    getUserInfo((await props.params).userId),
    getWishlistedItems((await props.params).userId),
  ]);

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8 pt-[60px] md:px-6 lg:px-8">
        <h1 className="my-2 font-bold md:text-xl xl:text-2xl">
          {user?.username || user?.name}&apos;s wishlist
        </h1>
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
                  isExternalGame
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
