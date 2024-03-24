import Image from "next/image";
import { GameTimeBadge } from "@/features/game/ui/card/time-badge";
import { Game } from "@prisma/client";

import { Badge, ColorVariant } from "@/components/ui/badge";
import { RenderWhen } from "@/components/render-when";

import { platformEnumToColor, uppercaseToNormal } from "@/lib/utils";

export const Artwork = ({ game }: { game: Partial<Game> }) => {
  return (
    <div className="group relative w-fit cursor-pointer rounded border bg-background text-white shadow-md transition-all hover:shadow-xl">
      <div className="flex size-32 items-center justify-center sm:size-36 md:size-48 xl:size-52">
        <Image
          src={game.imageUrl ?? ""}
          alt={`${game.title} cover art`}
          className="size-full rounded object-cover"
          width={256}
          height={256}
          priority
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
              {uppercaseToNormal(game.platform as string)}
            </Badge>
            <GameTimeBadge time={game.gameplayTime} />
          </div>
        </RenderWhen>
      </div>
    </div>
  );
};
