import { Game } from "@prisma/client";

import { Badge, ColorVariant } from "@/components/ui/badge";

import {
  cn,
  hasSelectedPlatformInList,
  platformEnumToColor,
} from "@/lib/utils";

import { FullGameInfoResponse } from "@/types/igdb";

export const Platforms = ({
  platformList,
  selectedPlatform,
}: {
  platformList: FullGameInfoResponse["release_dates"];
  selectedPlatform: Game["platform"];
}) => (
  <section>
    <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
      Platforms
    </h3>
    <div className="flex flex-grow-0 gap-2">
      {platformList.map((releaseDate) => {
        return (
          <Badge
            key={releaseDate.id}
            variant={
              platformEnumToColor(releaseDate.platform.name) as ColorVariant
            }
            className={cn("w-fit", {
              "font-bold": hasSelectedPlatformInList(
                releaseDate.platform.name,
                selectedPlatform as string
              ),
            })}
          >
            {releaseDate.platform.name}
          </Badge>
        );
      })}
    </div>
  </section>
);
