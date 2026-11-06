import { Badge } from "@/shared/ui/badge";

import {
  abbreviatePlatformName,
  getPlatformBadgeVariant,
  getPlatformFamily,
  getPlatformIcon,
} from "./platform-badges.utility";
import { PlatformDetailPopover } from "./platform-detail-popover";

export function PlatformBadgeItem({ name }: { name: string }) {
  const Icon = getPlatformIcon(name);
  const abbreviated = abbreviatePlatformName(name);
  const variant = getPlatformBadgeVariant(getPlatformFamily(name));

  const pill = (
    <Badge variant={variant} className="flex h-5 items-center gap-1 rounded-md">
      <Icon className="h-3 w-3" />
      <span>{abbreviated}</span>
    </Badge>
  );

  return abbreviated === name ? (
    pill
  ) : (
    <PlatformDetailPopover detail={name}>{pill}</PlatformDetailPopover>
  );
}
