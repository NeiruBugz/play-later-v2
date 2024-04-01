import { Game } from "@prisma/client";

import { Badge, ColorVariant } from "@/components/ui/badge";

import { FullGameInfoResponse } from "@/lib/types/igdb";
import {
  cn,
  hasSelectedPlatformInList,
  platformEnumToColor,
} from "@/lib/utils";

const uniqueRecords = (records: FullGameInfoResponse["release_dates"]) =>
  records.filter(
    (record, index, self) =>
      index === self.findIndex((r) => r.platform.name === record.platform.name)
  );

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
      {uniqueRecords(platformList).map((releaseDate) => {
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
