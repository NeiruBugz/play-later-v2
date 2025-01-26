import { FullGameInfoResponse } from "@/src/shared/types";
import { Card, CardContent } from "@/src/shared/ui/card";
import { IgdbImage } from "@/src/shared/ui/igdb-image";
import Link from "next/link";

export async function SimilarGames({
  similarGames,
}: {
  similarGames?: FullGameInfoResponse["similar_games"];
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Similar Games</h2>
      <div className="grid max-h-[300px] gap-4 overflow-scroll">
        {similarGames && similarGames.length
          ? similarGames.map((similarGame) => (
              <Link
                href={`/game/external/${similarGame.id}`}
                key={similarGame.id}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex gap-4 p-4">
                      {similarGame.cover?.image_id ? (
                        <IgdbImage
                          width={60}
                          height={80}
                          className="rounded"
                          gameTitle={similarGame.name}
                          coverImageId={similarGame.cover.image_id}
                          igdbSrcSize={"thumb"}
                          igdbImageSize={"hd"}
                        />
                      ) : null}
                      <div className="space-y-1">
                        <div className="font-medium">{similarGame.name}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          : null}
      </div>
    </div>
  );
}
