"use client";

import { Game } from "@prisma/client";

import { ArtworkImage } from "@/app/(protected)/library/components/game/ui/card/artwork-image";

export const Artwork = ({ game }: { game: Partial<Game> }) => {
  return (
    <div className="group relative w-fit cursor-pointer rounded-xl border bg-background text-white shadow-md transition-all hover:shadow-xl">
      <div className="flex items-center justify-center md:h-[352px] md:w-[264px]">
        <ArtworkImage
          title={game.title ?? ""}
          time={game.gameplayTime ?? 0}
          imageUrl={game.imageUrl ?? ""}
        />
      </div>
    </div>
  );
};
