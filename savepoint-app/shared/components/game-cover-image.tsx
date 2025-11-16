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
};

const SIZE_CONFIG: Record<
  ImageSize,
  { igdbSize: string; apiSize: string; blurDataUrl: string }
> = {
  thumbnail: {
    igdbSize: "t_thumb",
    apiSize: IMAGE_SIZES.screenshot_med,
    blurDataUrl:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTAiIGhlaWdodD0iOTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjkwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+",
  },
  cover_small: {
    igdbSize: "t_cover_small",
    apiSize: IMAGE_SIZES.cover_small,
    blurDataUrl:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iMTI4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI5NiIgaGVpZ2h0PSIxMjgiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=",
  },
  cover_big: {
    igdbSize: "t_cover_big",
    apiSize: IMAGE_SIZES.cover_big,
    blurDataUrl:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjY0IiBoZWlnaHQ9IjM1MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjY0IiBoZWlnaHQ9IjM1MiIgZmlsbD0iI2U1ZTdlYiIvPjwvc3ZnPg==",
  },
  hd: {
    igdbSize: "t_1080p",
    apiSize: IMAGE_SIZES.hd,
    blurDataUrl:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjY0IiBoZWlnaHQ9IjM1MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjY0IiBoZWlnaHQ9IjM1MiIgZmlsbD0iI2U1ZTdlYiIvPjwvc3ZnPg==",
  },
};

/**
 * Reusable game cover image component with consistent styling and placeholder
 *
 * Supports multiple image sources:
 * - IGDB image IDs (from cover.image_id in search results)
 * - Custom IMAGE_API URLs (from game.coverImage in database)
 *
 * Features:
 * - Automatic blur placeholder for better perceived performance
 * - Optional hover scale effect
 * - Lazy loading by default (can be overridden with priority)
 * - Fallback placeholder when no image available
 * - Responsive sizing with Next.js Image optimization
 *
 * @param imageId - Image identifier (IGDB image_id or full URL path)
 * @param gameTitle - Game title for alt text accessibility
 * @param size - Image size preset (thumbnail, cover_small, cover_big, hd)
 * @param className - Container div classes
 * @param imageClassName - Image element classes
 * @param showPlaceholder - Show placeholder when no imageId (default: true)
 * @param placeholderContent - Custom placeholder content
 * @param priority - Load image with priority (disables lazy loading)
 * @param sizes - Responsive sizes attribute for Next Image
 * @param enableHoverEffect - Enable scale-105 hover effect (default: true)
 *
 * @example
 * ```tsx
 * // IGDB image from search results
 * <GameCoverImage
 *   imageId={game.cover?.image_id}
 *   gameTitle={game.name}
 *   size="cover_big"
 *   className="h-32 w-24"
 *   sizes="96px"
 * />
 *
 * // Database coverImage URL
 * <GameCoverImage
 *   imageId={game.coverImage?.split("/").pop()?.replace(".jpg", "")}
 *   gameTitle={game.title}
 *   size="hd"
 *   className="aspect-[3/4]"
 *   sizes="(max-width: 768px) 50vw, 25vw"
 * />
 * ```
 */
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
    <div className={cn("bg-muted relative overflow-hidden", className)}>
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
      />
    </div>
  );
}
