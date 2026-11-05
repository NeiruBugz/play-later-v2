import { cn } from "@/shared/lib/utils";

import type { GameCoverProps } from "./game-cover.type";

/**
 * Display-only game cover. Renders a plain <img> when `src` is provided,
 * otherwise a placeholder element with `role="img"` so assistive tech still
 * announces the alt text.
 */
export function GameCover({
  src,
  alt,
  className,
  eager = false,
}: GameCoverProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={cn(
          "aspect-[3/4] w-full overflow-hidden rounded-lg object-cover shadow-md",
          className
        )}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "bg-muted aspect-[3/4] w-full overflow-hidden rounded-lg shadow-md",
        className
      )}
    />
  );
}
