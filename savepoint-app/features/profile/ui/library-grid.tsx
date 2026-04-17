import Link from "next/link";

import { GameCoverImage } from "@/shared/components/game-cover-image";
import { Badge } from "@/shared/components/ui/badge";
import { RatingInput } from "@/shared/components/ui/rating-input";
import { getStatusConfig, getUpNextLabel } from "@/shared/lib/library-status";
import { LibraryItemStatus } from "@/shared/types";

export type LibraryGridItem = {
  id: number;
  status: (typeof LibraryItemStatus)[keyof typeof LibraryItemStatus];
  hasBeenPlayed?: boolean;
  rating?: number | null;
  game: {
    title: string;
    coverImage: string | null;
    slug: string;
  };
};

export type LibraryGridProps = {
  items: LibraryGridItem[];
};

export function LibraryGrid({ items }: LibraryGridProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="library-grid-root"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    >
      {items.map((item) => {
        const { game, status } = item;
        const coverImageId =
          game.coverImage?.split("/").pop()?.replace(".jpg", "") ?? null;
        const statusConfig = getStatusConfig(status as LibraryItemStatus);
        const badgeLabel =
          status === LibraryItemStatus.UP_NEXT
            ? getUpNextLabel(item.hasBeenPlayed ?? false)
            : statusConfig.label;

        return (
          <Link
            key={item.id}
            href={`/games/${game.slug}`}
            data-testid="library-grid-item"
            aria-label={game.title}
            className="group relative block"
          >
            <div className="relative overflow-hidden rounded-lg">
              <GameCoverImage
                imageId={coverImageId}
                gameTitle={game.title}
                size="cover_big"
                className="aspect-[3/4] w-full"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
              />
              <div className="absolute top-2 left-2 z-10">
                <Badge
                  variant={statusConfig.badgeVariant}
                  data-testid="library-grid-status-badge"
                  className="shadow-paper-sm backdrop-blur-sm"
                >
                  {badgeLabel}
                </Badge>
              </div>
            </div>
            <p className="body-sm mt-2 line-clamp-2 font-medium">
              {game.title}
            </p>
            {item.rating !== null && item.rating !== undefined && (
              <div className="mt-1" data-testid="library-grid-rating">
                <RatingInput value={item.rating} readOnly size="sm" />
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
