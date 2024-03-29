import { Game } from "@prisma/client";

import { Badge, ColorVariant } from "@/components/ui/badge";

import { cn, platformEnumToColor } from "@/lib/utils";

export const Platform = ({ platform }: { platform: Game["platform"] }) => (
  <div>
    <h3
      className={cn("my-2 scroll-m-20 text-2xl font-semibold tracking-tight", {
        hidden: platform === undefined,
      })}
    >
      Platform
    </h3>
    {platform ? (
      <Badge variant={platformEnumToColor(platform) as ColorVariant}>
        {platform}
      </Badge>
    ) : null}
  </div>
);
