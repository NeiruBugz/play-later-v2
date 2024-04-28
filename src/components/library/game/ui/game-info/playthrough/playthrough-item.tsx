import { PlaythroughEditDialog } from "@/src/components/library/game/ui/game-info/playthrough/playthrough-edit-dialog";
import { Badge, ColorVariant } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { prisma } from "@/src/lib/prisma";
import { FullGameInfoResponse } from "@/src/lib/types/igdb";
import { platformEnumToColor } from "@/src/lib/utils";
import { Playthrough } from "@prisma/client";
import { Trash } from "lucide-react";

export const PlaythroughItem = ({
  id,
  label,
  platform,
  platforms,
}: {
  id: Playthrough["id"];
  label: Playthrough["label"];
  platform: Playthrough["platform"];
  platforms: FullGameInfoResponse["release_dates"];
}) => {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex flex-col gap-1 leading-none text-foreground">
        <span className="whitespace-nowrap font-medium">{label}</span>
        {platform ? (
          <Badge
            className="w-fit whitespace-nowrap"
            variant={platformEnumToColor(platform) as ColorVariant}
          >
            {platform}
          </Badge>
        ) : null}
      </div>
      <PlaythroughEditDialog id={id} platforms={platforms} />
      <form
        action={async () => {
          "use server";

          await prisma.playthrough.delete({ where: { id } });
        }}
      >
        <Button size="icon" type="submit" variant="destructive">
          <Trash className="size-4" />
        </Button>
      </form>
    </div>
  );
};