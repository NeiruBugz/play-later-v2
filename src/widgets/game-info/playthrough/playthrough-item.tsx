import { Trash } from "lucide-react";

import { db } from "@/src/shared/api";
import { platformEnumToColor } from "@/src/shared/lib/ui-variant-mappers";
import { Badge, type ColorVariant } from "@/src/shared/ui/badge";
import { Button } from "@/src/shared/ui/button";

import { PlaythroughEditDialog } from "@/src/features/edit-playthrough";

import type { PlaythroughItemProps } from "./types";

export const PlaythroughItem = ({
  id,
  label,
  platform,
  platforms,
}: PlaythroughItemProps) => {
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

          await db.playthrough.delete({ where: { id } });
        }}
      >
        <Button size="icon" type="submit" variant="destructive">
          <Trash className="size-4" />
        </Button>
      </form>
    </div>
  );
};
