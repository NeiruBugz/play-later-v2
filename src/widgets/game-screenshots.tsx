import igdbApi from "@/src/shared/api/igdb";
import { ScreenshotModal } from "@/src/widgets/screenshot-modal";

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
    <ul className="flex gap-3 overflow-auto">
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
