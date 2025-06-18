import { IgdbImage } from "@/shared/components/igdb-image";
import { FullGameInfoResponse } from "@/shared/types";

export async function SimilarGames({
  similarGames,
}: {
  similarGames?: FullGameInfoResponse["similar_games"];
}) {
  if (!similarGames?.length) {
    return null;
  }

  return (
    <div className="h-[200px] space-y-3 overflow-y-auto">
      {similarGames.map((game) => (
        <div
          key={game.id}
          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
        >
          {game.cover?.image_id ? (
            <IgdbImage
              width={50}
              height={75}
              className="rounded border"
              gameTitle={game.name}
              coverImageId={game.cover.image_id}
              igdbSrcSize={"thumb"}
              igdbImageSize={"hd"}
            />
          ) : null}
          <div>
            <p className="text-sm font-medium">{game.name}</p>
            {/* <p className="text-xs text-muted-foreground">
                {game..}
              </p> */}
          </div>
        </div>
      ))}
    </div>
  );
}
