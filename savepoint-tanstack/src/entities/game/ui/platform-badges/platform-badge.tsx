import { Badge } from "@/shared/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { getPlatformIcon, abbreviatePlatformName, getPlatformBadgeVariant, getPlatformFamily } from "./platform-badges.utility";

export function PlatformBadgeItem({ name }: { name: string }) {
  const Icon = getPlatformIcon(name);
  const abbreviated = abbreviatePlatformName(name);
  const variant = getPlatformBadgeVariant(getPlatformFamily(name));

  return (
    <Tooltip key={name}>
      <TooltipTrigger asChild>
        <Badge
          variant={variant}
          className="gap-xs px-sm flex h-5 items-center rounded-md text-[11px]"
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
}
