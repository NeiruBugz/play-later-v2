import { BacklogItemCard } from "@/components/backlog/backlog-item-card";
import { getWishlistedItems } from "@/features/backlog/actions";
import { GenericPageProps } from "@/src/shared/types";
import { Header } from "@/src/widgets/header";

export default async function SharedWishlistPage(props: GenericPageProps) {
  const wishlistedItems = await getWishlistedItems((await props.params).userId);
  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
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
                  isFromSharedWishlist
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
