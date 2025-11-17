import { Badge } from "@/shared/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  getPlatformBadgeVariant,
  getPlatformIcon,
} from "@/shared/lib/platform";

const MAX_VISIBLE_PLATFORMS = 5;
export const PlatformBadges = ({ platforms }: { platforms: string[] }) => {
  const visible = platforms.slice(0, MAX_VISIBLE_PLATFORMS);
  const remaining = platforms.slice(MAX_VISIBLE_PLATFORMS);
  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((name) => {
          const Icon = getPlatformIcon(name);
          return (
            <Badge
              key={name}
              variant={getPlatformBadgeVariant(name)}
              className="flex h-6 items-center gap-1 px-2 text-xs font-medium"
            >
              <Icon className="h-3 w-3" />
              <span>{name}</span>
            </Badge>
          );
        })}
        {remaining.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="h-6 cursor-help px-2 text-xs font-medium"
              >
                +{remaining.length}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="max-w-xs">{remaining.join(", ")}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
