import type { Game } from "@prisma/client";

import { ArtworkImage } from "@/src/components/shared/game-card/artwork-image";

export const Artwork = ({ game }: { game: Partial<Game> }) => {
  return (
    <div className="group relative w-fit cursor-pointer rounded-xl border bg-background text-white shadow-md transition-all hover:shadow-xl">
      <div className="flex items-center justify-center">
        <ArtworkImage
          imageUrl={game.imageUrl ?? ""}
          time={game.gameplayTime ?? 0}
          title={game.title ?? ""}
        />
      </div>
    </div>
  );
};
