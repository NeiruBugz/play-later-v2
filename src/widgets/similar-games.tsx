import { BacklogItemCard } from "@/src/entities/backlog-item";
import igdbApi from "@/src/shared/api/igdb";

export async function SimilarGames({ igdbId }: { igdbId: number }) {
  const games = await igdbApi.getSimilarGames(igdbId);

  if (!games) {
    return null;
  }

  return (
    <div className="my-4">
      <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
        Similar games
      </h3>
      <ul className="my-4 flex flex-wrap justify-center gap-3 md:justify-start">
        {games.similar_games?.map((game) => (
          <li key={game.id}>
            <BacklogItemCard
              game={{
                id: String(game.id),
                title: game.name,
                coverImage: game.cover.image_id,
              }}
              backlogItems={[]}
              isFromSharedWishlist
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
