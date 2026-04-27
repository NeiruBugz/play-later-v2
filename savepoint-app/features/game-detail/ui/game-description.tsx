import { cn } from "@/shared/lib/ui/utils";

import type { GameDescriptionProps } from "./game-description.types";

export function GameDescription({ summary }: GameDescriptionProps) {
  const displayText = summary?.trim() || "No description available";
  const isPlaceholder = !summary?.trim();
  return (
    <p
      className={cn(
        "text-body text-foreground/85 animate-fade-in max-w-[720px] leading-relaxed",
        isPlaceholder && "text-muted-foreground italic"
      )}
    >
      {displayText}
    </p>
  );
}
