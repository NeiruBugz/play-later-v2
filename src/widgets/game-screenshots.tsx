import igdbApi from "@/src/shared/api/igdb";
import { IgdbImage } from "@/src/shared/ui/igdb-image";

export async function GameScreenshots({
  gameId,
  gameName,
}: {
  gameId: number | null | undefined;
  gameName: string;
}) {
  const { screenshots } = await igdbApi.getGameScreenshots(gameId);

  if (!screenshots || screenshots.length === 0) {
    return <div>Screenshots not found</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {screenshots && screenshots
        ? screenshots?.map((i) => (
            <IgdbImage
              key={i.id}
              className="w-full rounded-lg"
              gameTitle={gameName}
              coverImageId={i.image_id}
              igdbSrcSize={"hd"}
              igdbImageSize={"c-big"}
            />
          ))
        : null}
    </div>
  );
}
