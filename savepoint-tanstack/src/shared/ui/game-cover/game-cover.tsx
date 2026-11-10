import { useState } from "react";

import {
  buildCoverImageProps,
  type IgdbCoverSize,
} from "@/shared/lib/igdb-image";
import { cn } from "@/shared/lib/utils";

import type { GameCoverProps, GameCoverSize } from "./game-cover.type";

const SIZES: Record<GameCoverSize, { width: string; igdb: IgdbCoverSize }> = {
  xs: { width: "w-12", igdb: "t_cover_small" },
  fluid: { width: "w-full", igdb: "t_cover_big" },
  lg: { width: "w-32 md:w-50", igdb: "t_cover_big_2x" },
};

export function GameCover({
  src,
  name,
  size = "fluid",
  priority = false,
  className,
  children,
}: GameCoverProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const image = buildCoverImageProps(src, SIZES[size].igdb);
  const showImage = image !== null && failedSrc !== image.src;

  return (
    <div
      className={cn(
        "relative aspect-[2/3] shrink-0 overflow-hidden rounded-lg bg-muted shadow-md ring-1 ring-foreground/10 transition-shadow group-hover:shadow-lg group-hover:ring-foreground/20",
        SIZES[size].width,
        className
      )}
    >
      {showImage ? (
        <img
          src={image.src}
          srcSet={image.srcSet}
          alt={name}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          onError={() => setFailedSrc(image.src)}
          className="size-full object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={name}
          className="flex size-full items-center justify-center p-2 text-center"
        >
          <span
            aria-hidden="true"
            className="line-clamp-3 text-xs leading-tight font-medium break-words text-muted-foreground"
          >
            {name}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
