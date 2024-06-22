import { GameCard } from "@/src/entities/game";
import Link from "next/link";
import { getUserGamesWithGroupedBacklog } from "@/src/entities/game/api/get-games";

export async function CollectionList() {
  const collection = await getUserGamesWithGroupedBacklog();


  if (!collection || collection.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">Your collection is empty</h1>
        <p className="text-gray-500">
          Start <Link href="/collection/add-game" className="font-bold hover:underline cursor-pointer">adding</Link> games to your collection
        </p>
      </div>
    );
  }


  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-center sm:justify-start">
      {collection?.map(({ game, backlogItems }) => (
        <li key={game.id} className="bg-background rounded-lg overflow-hidden shadow-md w-fit">
          <GameCard
            game={{ id: game.id, title: game.title, coverImage: game.coverImage }}
            backlogItems={backlogItems}
          />
        </li>
      ))}
    </ul>
  );
}
