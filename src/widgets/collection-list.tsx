import { getUserGamesWithGroupedBacklog } from "@/src/entities/backlog-item";
import { GameCard } from "@/src/entities/game";
import { CollectionFilters } from "@/src/features/filter";
import Link from "next/link";
import { Suspense } from "react";

export async function CollectionList({
  params,
}: {
  params: Record<string, string>;
}) {
  const collection = await getUserGamesWithGroupedBacklog({
    platform: params.platform,
    status: params.status,
  });

  if (
    !collection ||
    (collection.length === 0 && Object.keys(params).length === 0)
  ) {
    return (
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">Your collection is empty</h1>
        <p className="text-gray-500">
          Start{" "}
          <Link
            href="/collection/add-game"
            className="cursor-pointer font-bold hover:underline"
          >
            adding
          </Link>{" "}
          games to your collection
        </p>
      </div>
    );
  }

  if (collection.length === 0 && Object.keys(params).length !== 0) {
    return (
      <div>
        <Suspense fallback={"Loading..."}>
          <CollectionFilters />
        </Suspense>
        <div>No matches found</div>
      </div>
    );
  }

  return (
    <div>
      <Suspense fallback={"Loading..."}>
        <CollectionFilters />
      </Suspense>
      <ul className="flex flex-wrap justify-center gap-3 md:justify-start">
        {collection?.map(({ game, backlogItems }) => (
          <li
            key={game.id}
            className="h-40 w-fit overflow-hidden rounded-lg border bg-background shadow-md hover:shadow-xl"
          >
            <GameCard
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
