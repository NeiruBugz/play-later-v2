import type { GameWithBacklogItems } from "@/features/dashboard/server-actions/get-user-games-with-grouped-backlog";
import { cn, getGameUrl } from "@/shared/lib";
import { BacklogItemStatus } from "@prisma/client";
import { CalendarDays, Monitor } from "lucide-react";
import Link from "next/link";
import { Badge } from "./badge";
import { Button } from "./button";
import { IgdbImage } from "./igdb-image";

const statusColors = {
  TO_PLAY:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  PLAYING: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  PLAYED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  COMPLETED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  WISHLIST: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
};

const statusLabels = {
  TO_PLAY: "Backlog",
  PLAYING: "Playing",
  PLAYED: "Played",
  COMPLETED: "Completed",
  WISHLIST: "Wishlist",
};

export function ListView({
  backlogItems,
}: {
  backlogItems: GameWithBacklogItems[];
}) {
  return (
    <div className="space-y-3">
      {backlogItems.map(({ game, backlogItems }) => {
        const primaryPlatform = backlogItems[0];
        const status = primaryPlatform?.status || "TO_PLAY";

        return (
          <div
            key={game.id}
            className="group flex items-center gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-md"
          >
            {/* Game Cover */}
            <div className="flex-shrink-0">
              <div className="relative h-20 w-16 overflow-hidden rounded-md border">
                <IgdbImage
                  gameTitle={game.title}
                  coverImageId={game.coverImage}
                  igdbSrcSize={"hd"}
                  igdbImageSize={"c-sm"}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Game Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold leading-tight">
                    {game.title}
                  </h3>
                  {game.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {game.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={getGameUrl(game.id)}>View Details</Link>
                  </Button>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {/* Status */}
                <Badge
                  variant="secondary"
                  className={cn(statusColors[status as BacklogItemStatus])}
                >
                  {statusLabels[status as BacklogItemStatus]}
                </Badge>

                {/* Platform */}
                {primaryPlatform?.platform && (
                  <div className="flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    <span>{primaryPlatform.platform}</span>
                  </div>
                )}

                {/* Release Date */}
                {game.releaseDate && (
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    <span>
                      {new Date(game.releaseDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Multiple Platforms Indicator */}
                {backlogItems.length > 1 && (
                  <Badge variant="outline" className="text-xs">
                    +{backlogItems.length - 1} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
