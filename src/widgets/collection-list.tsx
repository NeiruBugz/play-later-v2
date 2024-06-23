import { GameCard } from "@/src/entities/game";
import Link from "next/link";
import { getUserGamesWithGroupedBacklog } from "@/src/entities/game/api/get-games";
import { Suspense } from "react";
import { CollectionFilters } from "@/src/features/filter/ui/collection-filters";

export async function CollectionList({ params }: { params: Record<string, string> }) {
  const collection = await getUserGamesWithGroupedBacklog({
    platform: params.platform,
    status: params.status,
  });

  if (!collection || collection.length === 0 && Object.keys(params).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">Your collection is empty</h1>
        <p className="text-gray-500">
          Start <Link href="/collection/add-game"
                      className="font-bold hover:underline cursor-pointer">adding</Link> games to your collection
        </p>
      </div>
    );
  }

  if (collection.length === 0 && Object.keys(params).length !== 0) {
    return (
      <div>
        <Suspense fallback={"Loading..."}>
          <CollectionFilters/>
        </Suspense>
        <div>
          No matches found
        </div>
      </div>
    );
  }


  return (
    <div>
      <Suspense fallback={"Loading..."}>
        <CollectionFilters/>
      </Suspense>
      <ul
        className="flex flex-wrap gap-3 justify-center md:justify-start">
        {collection?.map(({ game, backlogItems }) => (
          <li key={game.id} className="bg-background rounded-lg overflow-hidden shadow-md w-fit hover:shadow-xl">
            <GameCard
              game={{ id: game.id, title: game.title, coverImage: game.coverImage }}
              backlogItems={backlogItems}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
