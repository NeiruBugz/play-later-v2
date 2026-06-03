import { Badge } from "@/shared/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

import type { PlatformBadgesProps } from "./platform-badges.type";
import {
  MAX_VISIBLE_PLATFORMS,
} from "./platform-badges.utility";
import { PlatformBadgeItem } from "./platform-badge";

export function PlatformBadges({ platforms }: PlatformBadgesProps) {
  const visible = platforms.slice(0, MAX_VISIBLE_PLATFORMS);
  const remaining = platforms.slice(MAX_VISIBLE_PLATFORMS);

  return (
    <TooltipProvider>
      <div className="gap-xs flex flex-wrap items-center">
        {visible.map((name) => <PlatformBadgeItem name={name} key={name} />)}
        {remaining.length > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="subtle"
                className="px-sm h-5 cursor-help rounded-md text-[11px]"
              >
                +{remaining.length}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="max-w-xs">{remaining.join(", ")}</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
