import { Badge } from "@/shared/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import {
  abbreviatePlatformName,
  getPlatformBadgeVariant,
  getPlatformFamily,
  getPlatformIcon,
} from "./platform-badges.utility";

export function PlatformBadgeItem({ name }: { name: string }) {
  const Icon = getPlatformIcon(name);
  const abbreviated = abbreviatePlatformName(name);
  const variant = getPlatformBadgeVariant(getPlatformFamily(name));

  return (
    <Tooltip key={name}>
      <TooltipTrigger
        render={
          <Badge
            variant={variant}
            className="flex h-5 items-center gap-1 rounded-md px-1.5 text-[11px]"
          />
        }
      >
        <Icon className="h-3 w-3" />
        <span>{abbreviated}</span>
      </TooltipTrigger>
      {abbreviated !== name ? (
        <TooltipContent side="top">
          <p>{name}</p>
        </TooltipContent>
      ) : null}
    </Tooltip>
  );
}
