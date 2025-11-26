import { PlatformBadges } from "@/shared/components/platform-badges";
import { cn } from "@/shared/lib/ui/utils";

import type { GameCardMetaProps } from "./game-card.types";

/**
 * GameCardMeta - Displays game metadata (release year, platforms, status)
 */
export function GameCardMeta({
  releaseYear,
  platforms = [],
  showPlatforms = true,
  className,
  ...props
}: GameCardMetaProps) {
  const hasMeta = releaseYear || (showPlatforms && platforms.length > 0);

  if (!hasMeta) {
    return null;
  }

  return (
    <div className={cn("gap-md flex flex-col", className)} {...props}>
      {/* Release year */}
      {releaseYear && (
        <span className="body-sm text-muted-foreground">{releaseYear}</span>
      )}

      {/* Platform badges */}
      {showPlatforms && platforms.length > 0 && (
        <PlatformBadges platforms={platforms} />
      )}
    </div>
  );
}

GameCardMeta.displayName = "GameCardMeta";
