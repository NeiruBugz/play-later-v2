import { PlusCircle } from "lucide-react";

import { PlatformBadgeItem } from "@/entities/game/ui/platform-badges";
import {
  LibraryLifecycleStrip,
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
import { Button } from "@/shared/ui/button";
import { RatingInput } from "@/shared/ui/rating-input";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { GameCard } from "@/widgets/game-card";

import type { LibraryItemCardProps } from "./library-item-card.type";
import { getStatusCoverAccent } from "./library-item-card.utility";

export function LibraryItemCard({
  item,
  menu,
  layout = "responsive",
  onAddPlaythrough,
}: LibraryItemCardProps) {
  const isRow = layout === "row";
  const { status, setStatus, isPending } = useSetStatus({
    id: item.id,
    gameTitle: item.game.title,
    status: item.status,
    upNextPosition: item.upNextPosition,
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
          coverAccentClassName={getStatusCoverAccent(status)}
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

        <LibraryLifecycleStrip
          status={status}
          createdAt={item.createdAt}
          startedAt={item.startedAt}
          completedAt={item.completedAt}
          className={cn("mt-0.5 mb-1", !isRow && "md:mt-2")}
        />

        <div
          className={cn(
            "text-muted-foreground mt-0 flex h-4 items-center gap-1.5 truncate text-[11px] leading-none",
            !isRow && "md:mt-1"
          )}
          data-testid="library-item-card-metadata"
        >
          {hasPlatform ? (
            <TooltipProvider>
              <PlatformBadgeItem name={item.platform!} />
            </TooltipProvider>
          ) : null}
        </div>

        <div
          className="mt-0.5 flex h-4 items-center"
          data-testid="library-item-card-rating"
          onClickCapture={(event) => {
            event.stopPropagation();
          }}
        >
          {item.rating === null ? (
            <span className="text-muted-foreground text-xs italic">
              unrated
            </span>
          ) : (
            <RatingInput
              value={item.rating}
              size="sm"
              readOnly
              aria-label={`Rating: ${item.rating / 2} out of 5 stars`}
            />
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

        {onAddPlaythrough !== undefined ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="mt-1 w-full text-xs font-medium"
            onClick={() => onAddPlaythrough(item.id)}
            aria-label="Add playthrough"
          >
            <PlusCircle aria-hidden />
            Add playthrough
          </Button>
        ) : null}
      </div>
    </div>
  );
}
