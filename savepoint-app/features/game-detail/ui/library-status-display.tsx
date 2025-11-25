"use client";

import type { LibraryItemStatus } from "@/shared/types";
import {
  BookmarkIcon,
  ClockIcon,
  GamepadIcon,
  HeartIcon,
  PauseIcon,
  SparklesIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { formatAbsoluteDate } from "@/shared/lib/date";
import {
  LIBRARY_STATUS_LABELS,
  LIBRARY_STATUS_VARIANTS,
} from "@/shared/lib/library-status";

import { deleteLibraryItemAction } from "../server-actions";
import { AddToLibraryButton } from "./add-to-library-button";
import { LibraryModal } from "./library-modal";
import type { LibraryStatusDisplayProps } from "./library-status-display.types";

const STATUS_ICONS: Record<
  LibraryItemStatus,
  React.ComponentType<{ className?: string }>
> = {
  CURIOUS_ABOUT: SparklesIcon,
  CURRENTLY_EXPLORING: GamepadIcon,
  TOOK_A_BREAK: PauseIcon,
  EXPERIENCED: HeartIcon,
  WISHLIST: BookmarkIcon,
  REVISITING: ClockIcon,
};

export const LibraryStatusDisplay = ({
  gameId,
  userLibraryStatus,
  igdbId,
  gameTitle,
}: LibraryStatusDisplayProps) => {
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  if (!userLibraryStatus) {
    return (
      <Card className="animate-fade-in w-full">
        <CardHeader className="pb-lg">
          <CardTitle className="text-base">Library Status</CardTitle>
          <CardDescription>Add this game to your library</CardDescription>
        </CardHeader>
        <CardContent>
          <AddToLibraryButton
            igdbId={igdbId}
            gameTitle={gameTitle}
            gameId={gameId}
          />
        </CardContent>
      </Card>
    );
  }

  const status = userLibraryStatus.mostRecent.status;
  const Icon = STATUS_ICONS[status];
  const statusLabel = LIBRARY_STATUS_LABELS[status];
  const badgeVariant = LIBRARY_STATUS_VARIANTS[status];
  const updatedDate = formatAbsoluteDate(userLibraryStatus.updatedAt);

  const handleDeleteItem = async (itemId: number) => {
    const result = await deleteLibraryItemAction({ libraryItemId: itemId });
    if (result.success) {
      toast.success("Library entry deleted");
    } else {
      toast.error(result.error || "Failed to delete library entry");
    }
  };
  return (
    <>
      <Card className="animate-fade-in w-full">
        <CardHeader className="pb-lg">
          <CardTitle className="text-base font-serif">Library Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-lg">
          <div className="flex items-center gap-md" role="status">
            <Badge
              variant={badgeVariant}
              className="text-sm"
              aria-label={`Status: ${statusLabel}`}
            >
              <Icon
                className="mr-xs h-3.5 w-3.5"
                aria-hidden="true"
                data-testid="library-status-icon"
              />
              {statusLabel}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            <time dateTime={userLibraryStatus.updatedAt.toISOString()}>
              Updated: {updatedDate}
            </time>
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsManageModalOpen(true)}
            aria-label={`Manage library entries for ${gameTitle}`}
          >
            Manage Library
          </Button>
        </CardContent>
      </Card>
      <LibraryModal
        gameId={gameId}
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        igdbId={igdbId}
        gameTitle={gameTitle}
        mode="edit"
        existingItems={userLibraryStatus.allItems}
        onDeleteItem={handleDeleteItem}
      />
    </>
  );
};
