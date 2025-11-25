import { cn } from "@/shared/lib/ui/utils";

import type { GameDescriptionProps } from "./game-description.types";

export function GameDescription({ summary }: GameDescriptionProps) {
  const displayText = summary?.trim() || "No description available";
  const isPlaceholder = !summary?.trim();
  return (
    <p
      className={cn(
        "body-lg text-muted-foreground",
        isPlaceholder && "italic"
      )}
    >
      {displayText}
    </p>
  );
}
