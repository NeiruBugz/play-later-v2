import { PlatformBadgeItem } from "@/entities/game/ui/platform-badges";
import {
  LibraryStatusBadge,
  NextStepButton,
  NotOwnedTag,
  QueueMarker,
  StatusControl,
} from "@/entities/library-item";
import {
  useSetOwnership,
  useSetStatus,
} from "@/features/manage-library-entry/model";
import { useUpNextMembership } from "@/features/up-next/model/use-up-next-membership";
import { UpNextMenuActions } from "@/features/up-next/ui/up-next-menu-actions";
import { cn } from "@/shared/lib/utils";
import { RatingInput } from "@/shared/ui/rating-input";
import { GameCard } from "@/widgets/game-card";

import type { LibraryItemCardProps } from "./library-item-card.type";

export function LibraryItemCard({
  item,
  menu,
  layout = "responsive",
}: LibraryItemCardProps) {
  const isRow = layout === "row";
  const { status, setStatus, isPending } = useSetStatus({
    id: item.id,
    gameTitle: item.game.title,
    status: item.status,
    upNextPosition: item.upNextPosition,
    rating: item.rating,
  });
  const ownership = useSetOwnership({
    id: item.id,
    gameTitle: item.game.title,
    isOwned: item.isOwned,
  });
  const membership = useUpNextMembership({
    id: item.id,
    gameTitle: item.game.title,
    upNextPosition: item.upNextPosition,
  });
  const menuNode =
    typeof menu === "function"
      ? menu(
          <UpNextMenuActions status={status} membership={membership} />,
          ownership
        )
      : menu;
  const hasPlatform =
    typeof item.platform === "string" && item.platform.trim().length > 0;

  return (
    <div
      className={cn(
        "relative flex flex-row gap-3",
        !isRow && "md:flex-col md:gap-0"
      )}
      data-testid="library-item-card-root"
    >
      <div className={cn("relative w-20 shrink-0", !isRow && "md:w-auto")}>
        <GameCard
          game={{
            slug: item.game.slug,
            title: item.game.title,
            coverImageId: item.game.coverImage,
          }}
          asLink
          density="minimal"
          badges={
            <div
              className={cn(
                "absolute bottom-2 left-2 flex flex-col items-start gap-1",
                !isRow && "md:top-2 md:bottom-auto"
              )}
            >
              <LibraryStatusBadge status={status} />
            </div>
          }
        />
        {menuNode ? (
          <div className="absolute top-2 right-2 z-10">{menuNode}</div>
        ) : null}
      </div>

      <div
        className={cn("flex min-w-0 flex-1 flex-col", !isRow && "md:contents")}
      >
        <h3
          className={cn(
            "mt-0.5 line-clamp-2 text-sm leading-tight font-semibold",
            !isRow && "md:mt-2 md:min-h-[2lh]"
          )}
        >
          {item.game.title}
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-1 self-start empty:hidden">
          <QueueMarker
            status={status}
            upNextPosition={membership.upNextPosition}
          />
          <NotOwnedTag status={status} isOwned={ownership.isOwned} />
        </div>

        <div
          className={cn(
            "mt-0 flex h-4 items-center gap-1.5 text-xs leading-none text-muted-foreground",
            !isRow && "md:mt-1"
          )}
          data-testid="library-item-card-metadata"
        >
          {hasPlatform ? <PlatformBadgeItem name={item.platform!} /> : null}
        </div>

        <div
          className="mt-0.5 flex h-4 items-center"
          data-testid="library-item-card-rating"
          onClickCapture={(event) => {
            event.stopPropagation();
          }}
        >
          {item.rating === null ? null : (
            <RatingInput value={item.rating} size="sm" readOnly />
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusControl
            status={status}
            onChange={(to) => void setStatus(to)}
            disabled={isPending}
            className="text-xs"
          />
          <NextStepButton
            status={status}
            onStep={(to) => void setStatus(to)}
            disabled={isPending}
            className="text-xs font-semibold"
          />
        </div>
      </div>
    </div>
  );
}
