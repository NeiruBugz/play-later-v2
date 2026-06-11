import { Badge } from "@/shared/ui/badge";

import type { PlatformPillProps } from "./platform-pill.type";
import { abbreviatePlatform } from "./platform-pill.utility";

export function PlatformPill({ platform }: PlatformPillProps) {
  if (!platform) return null;

  const label = abbreviatePlatform(platform);

  return (
    <span data-testid="platform-pill">
      <Badge
        variant="subtle"
        className="gap-xs px-sm flex h-5 items-center rounded-md text-[11px]"
      >
        {label}
      </Badge>
    </span>
  );
}
