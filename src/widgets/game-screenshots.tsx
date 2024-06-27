import { ScreenshotModal } from "@/src/widgets/screenshot-modal";
import igdbApi from "@/src/shared/api/igdb";

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
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {screenshots.map((screenshot) => {
        return (
          <ScreenshotModal
            key={screenshot.id}
            gameName={gameName}
            imageId={screenshot.image_id}
          />
        );
      })}
    </ul>
  );
}
