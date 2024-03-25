import Image from "next/image";
import { GameTimeBadge } from "@/features/game/ui/card/time-badge";
import { Game } from "@prisma/client";

import { Badge, ColorVariant } from "@/components/ui/badge";
import { RenderWhen } from "@/components/render-when";

import { platformEnumToColor } from "@/lib/utils";

export const Artwork = ({ game }: { game: Partial<Game> }) => {
  return (
    <div className="group relative w-fit cursor-pointer rounded-xl border bg-background text-white shadow-md transition-all hover:shadow-xl">
      <div className="flex h-[352px] w-[264px] items-center justify-center">
        <Image
          src={game.imageUrl ?? ""}
          alt={`${game.title} cover art`}
          className="h-full w-full rounded-xl object-cover"
          unoptimized
          fill
        />
        <RenderWhen condition={Boolean(game.platform)}>
          <div className="absolute right-2 top-2 flex w-fit flex-col items-end gap-1 normal-case">
            <Badge
              variant={
                game.platform
                  ? (platformEnumToColor(game.platform) as ColorVariant)
                  : "default"
              }
            >
              {game.platform}
            </Badge>
            <GameTimeBadge time={game.gameplayTime} />
          </div>
        </RenderWhen>
      </div>
    </div>
  );
};
