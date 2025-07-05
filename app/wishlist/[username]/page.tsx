import { getWishlistedItemsByUsername } from "@/features/view-wishlist/server-actions/get-wishlisted-items";
import { BacklogItemCard } from "@/shared/components/backlog-item-card";
import { Header } from "@/shared/components/header";
import { GenericPageProps } from "@/shared/types";

export default async function SharedWishlistPage(props: GenericPageProps) {
  const { username } = await props.params;
  const decodedUsername = decodeURIComponent(username);
  const { data: wishlistedItems, serverError } =
    await getWishlistedItemsByUsername({ username: decodedUsername });

  if (serverError) {
    return <div>{serverError}</div>;
  }

  if (!wishlistedItems || wishlistedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">No wishlist found</h1>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container overflow-hidden px-4 py-8 pt-[60px]">
        <div className="mb-8 mt-4 flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {decodedUsername}&apos;s wishlist
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
