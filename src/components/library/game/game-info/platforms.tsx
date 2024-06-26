import type { FullGameInfoResponse } from "@/src/packages/types/igdb";

import { Badge, ColorVariant } from "@/src/components/ui/badge";
import { cn, platformEnumToColor } from "@/src/packages/utils";

const uniqueRecords = (records: FullGameInfoResponse["release_dates"]) =>
  records && records.length
    ? records.filter(
        (record, index, self) =>
          index ===
          self.findIndex((r) => r.platform.name === record.platform.name)
      )
    : records;

export const Platforms = ({
  platformList,
}: {
  platformList: FullGameInfoResponse["release_dates"];
}) =>
  platformList && platformList.length ? (
    <section>
      <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
        Released on
      </h3>
      <div className="flex flex-grow-0 flex-wrap gap-2">
        {uniqueRecords(platformList).map((releaseDate) => {
          return (
            <Badge
              className={cn("w-fit")}
              key={releaseDate.id}
              variant={
                platformEnumToColor(releaseDate.platform.name) as ColorVariant
              }
            >
              {releaseDate.platform.name}
            </Badge>
          );
        })}
      </div>
    </section>
  ) : null;
