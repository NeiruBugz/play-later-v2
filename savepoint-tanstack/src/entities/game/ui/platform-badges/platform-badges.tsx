import { Badge } from "@/shared/ui/badge";

import { PlatformBadgeItem } from "./platform-badge";
import type { PlatformBadgesProps } from "./platform-badges.type";
import { MAX_VISIBLE_PLATFORMS } from "./platform-badges.utility";
import { PlatformDetailPopover } from "./platform-detail-popover";

export function PlatformBadges({ platforms }: PlatformBadgesProps) {
  const visible = platforms.slice(0, MAX_VISIBLE_PLATFORMS);
  const remaining = platforms.slice(MAX_VISIBLE_PLATFORMS);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((name) => (
        <PlatformBadgeItem name={name} key={name} />
      ))}
      {remaining.length > 0 ? (
        <PlatformDetailPopover detail={remaining.join(", ")}>
          <Badge variant="subtle" className="h-5 rounded-md">
            +{remaining.length}
          </Badge>
        </PlatformDetailPopover>
      ) : null}
    </div>
  );
}
