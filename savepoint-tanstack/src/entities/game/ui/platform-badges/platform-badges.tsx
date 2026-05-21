import { Badge } from "@/shared/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

import type { PlatformBadgesProps } from "./platform-badges.type";
import {
  abbreviatePlatformName,
  getPlatformIcon,
  MAX_VISIBLE_PLATFORMS,
} from "./platform-badges.utility";

// Display-only game-domain component. Mirrors savepoint-app
// `shared/components/platform-badges.tsx`: abbreviated icon chips, max 4
// visible, a "+N" overflow chip, tooltips for the full name on each.
export function PlatformBadges({ platforms }: PlatformBadgesProps) {
  const visible = platforms.slice(0, MAX_VISIBLE_PLATFORMS);
  const remaining = platforms.slice(MAX_VISIBLE_PLATFORMS);

  return (
    <TooltipProvider>
      <div className="gap-xs flex flex-wrap items-center">
        {visible.map((name) => {
          const Icon = getPlatformIcon(name);
          const abbreviated = abbreviatePlatformName(name);
          return (
            <Tooltip key={name}>
              <TooltipTrigger asChild>
                <Badge
                  variant="subtle"
                  className="gap-xs px-sm flex h-5 items-center text-[11px]"
                >
                  <Icon className="h-3 w-3" />
                  <span>{abbreviated}</span>
                </Badge>
              </TooltipTrigger>
              {abbreviated !== name ? (
                <TooltipContent side="top">
                  <p>{name}</p>
                </TooltipContent>
              ) : null}
            </Tooltip>
          );
        })}
        {remaining.length > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="subtle"
                className="px-sm h-5 cursor-help text-[11px]"
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
