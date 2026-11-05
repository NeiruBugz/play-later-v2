import { Badge } from "@/shared/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

import { PlatformBadgeItem } from "./platform-badge";
import type { PlatformBadgesProps } from "./platform-badges.type";
import { MAX_VISIBLE_PLATFORMS } from "./platform-badges.utility";

export function PlatformBadges({ platforms }: PlatformBadgesProps) {
  const visible = platforms.slice(0, MAX_VISIBLE_PLATFORMS);
  const remaining = platforms.slice(MAX_VISIBLE_PLATFORMS);

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-1">
        {visible.map((name) => (
          <PlatformBadgeItem name={name} key={name} />
        ))}
        {remaining.length > 0 ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Badge
                  variant="subtle"
                  className="h-5 cursor-help rounded-md px-1.5 text-[11px]"
                />
              }
            >
              +{remaining.length}
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
