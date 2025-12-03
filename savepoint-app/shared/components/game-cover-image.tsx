import Image from "next/image";

import { IMAGE_API, IMAGE_SIZES } from "@/shared/config/image.config";
import { cn } from "@/shared/lib/ui/utils";

type ImageSize = "thumbnail" | "cover_small" | "cover_big" | "hd";
type GameCoverImageProps = {
  imageId: string | null | undefined;
  gameTitle: string;
  size?: ImageSize;
  className?: string;
  imageClassName?: string;
  showPlaceholder?: boolean;
  placeholderContent?: React.ReactNode;
  priority?: boolean;
  sizes?: string;
  enableHoverEffect?: boolean;
  fetchPriority?: "auto" | "high" | "low";
};
const SIZE_CONFIG: Record<
  ImageSize,
  { igdbSize: string; apiSize: string; blurDataUrl: string }
> = {
  thumbnail: {
    igdbSize: "t_thumb",
    apiSize: IMAGE_SIZES.thumb,
    blurDataUrl:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTAiIGhlaWdodD0iOTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjkwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+",
  },
  cover_small: {
    igdbSize: "t_cover_small",
    apiSize: IMAGE_SIZES["c-sm"],
    blurDataUrl:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iMTI4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI5NiIgaGVpZ2h0PSIxMjgiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=",
  },
  cover_big: {
    igdbSize: "t_cover_big",
    apiSize: IMAGE_SIZES["c-big"],
    blurDataUrl:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjY0IiBoZWlnaHQ9IjM1MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjY0IiBoZWlnaHQ9IjM1MiIgZmlsbD0iI2U1ZTdlYiIvPjwvc3ZnPg==",
  },
  hd: {
    igdbSize: "t_720p",
    apiSize: IMAGE_SIZES.hd,
    blurDataUrl:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjY0IiBoZWlnaHQ9IjM1MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjY0IiBoZWlnaHQ9IjM1MiIgZmlsbD0iI2U1ZTdlYiIvPjwvc3ZnPg==",
  },
};

export function GameCoverImage({
  imageId,
  gameTitle,
  size = "cover_big",
  className,
  imageClassName,
  showPlaceholder = true,
  placeholderContent,
  priority = false,
  sizes,
  enableHoverEffect = true,
  fetchPriority = "auto",
}: GameCoverImageProps) {
  const config = SIZE_CONFIG[size];
  if (!imageId && !showPlaceholder) {
    return null;
  }
  if (!imageId) {
    return (
      <div
        className={cn(
          "bg-muted text-muted-foreground flex items-center justify-center",
          className
        )}
      >
        {placeholderContent ?? (
          <div className="text-center text-xs">No Cover</div>
        )}
      </div>
    );
  }
  const isIgdbUrl = imageId.includes("igdb.com");
  const src = isIgdbUrl
    ? imageId
    : `${IMAGE_API}/${config.apiSize}/${imageId}.jpg`;
  return (
    <div
      className={cn("bg-muted relative overflow-hidden", className)}
      data-testid="game-cover-container"
    >
      <Image
        src={src}
        alt={`${gameTitle} cover`}
        fill
        className={cn(
          "object-cover",
          enableHoverEffect &&
            "transition-transform duration-300 group-hover:scale-105",
          imageClassName
        )}
        loading={priority ? undefined : "lazy"}
        priority={priority}
        sizes={sizes}
        placeholder="blur"
        blurDataURL={config.blurDataUrl}
        fetchPriority={priority ? "high" : fetchPriority}
      />
    </div>
  );
}
