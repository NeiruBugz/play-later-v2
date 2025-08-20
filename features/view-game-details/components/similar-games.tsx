import Link from "next/link";

import { IgdbImage } from "@/shared/components/igdb-image";
import { Body } from "@/shared/components/typography";
import { type FullGameInfoResponse } from "@/shared/types";

function SimilarGame({
  game,
}: {
  game: FullGameInfoResponse["similar_games"][number];
}) {
  return (
    <Link href={`/game/external/${game.id}`} key={game.id}>
      <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted">
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
          <Body size="sm" className="font-medium">
            {game.name}
          </Body>
          {/* <p className="text-xs text-muted-foreground">
                {game..}
              </p> */}
        </div>
      </div>
    </Link>
  );
}

export function SimilarGames({
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
        <SimilarGame key={game.id} game={game} />
      ))}
    </div>
  );
}
