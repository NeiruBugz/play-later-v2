import Image from "next/image";
import { Game } from "@prisma/client";

import { IMAGE_API, IMAGE_SIZES } from "@/lib/config/site";

import { GameTimeBadge } from "@/app/(protected)/library/components/game/ui/card/time-badge";

export const Artwork = ({ game }: { game: Partial<Game> }) => {
  return (
    <div className="group relative w-fit cursor-pointer rounded-xl border bg-background text-white shadow-md transition-all hover:shadow-xl">
      <div className="flex h-[352px] w-[264px] items-center justify-center">
        <Image
          src={`${IMAGE_API}/${IMAGE_SIZES["c-big"]}/${game.imageUrl}.png`}
          alt={`${game.title} cover art`}
          width={264}
          height={352}
          style={{
            maxWidth: "100%",
            height: "auto",
          }}
          className="h-full w-full rounded-xl object-cover"
        />
        <div className="absolute right-2 top-2 flex w-fit flex-col items-end gap-1 normal-case">
          <GameTimeBadge time={game.gameplayTime} />
        </div>
      </div>
    </div>
  );
};
