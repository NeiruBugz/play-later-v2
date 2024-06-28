import {
  BacklogItemCard,
  getUserGamesWithGroupedBacklog,
} from "@/src/entities/backlog-item";
import { CollectionFilters } from "@/src/widgets/collection-filters";
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
    search: params.search,
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
            className="hover:font-bolder cursor-pointer font-bold underline"
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
      <ul className="flex max-h-[624px] flex-wrap justify-center gap-3 overflow-scroll md:max-h-[824px] md:justify-start">
        {collection?.map(({ game, backlogItems }) => (
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
