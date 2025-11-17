"use client";

import type { LibraryItemStatus } from "@prisma/client";
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

import { deleteLibraryItemAction } from "../server-actions";
import { AddToLibraryButton } from "./add-to-library-button";
import { LibraryModal } from "./library-modal";
import type { LibraryStatusDisplayProps } from "./library-status-display.types";

const STATUS_CONFIG: Record<
  LibraryItemStatus,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  CURIOUS_ABOUT: { label: "Curious About", icon: SparklesIcon },
  CURRENTLY_EXPLORING: { label: "Currently Exploring", icon: GamepadIcon },
  TOOK_A_BREAK: { label: "Taking a Break", icon: PauseIcon },
  EXPERIENCED: { label: "Experienced", icon: HeartIcon },
  WISHLIST: { label: "Wishlist", icon: BookmarkIcon },
  REVISITING: { label: "Revisiting", icon: ClockIcon },
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
      <Card className="w-full">
        <CardHeader className="pb-3">
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
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
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
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Library Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2" role="status">
            <Icon
              className="text-primary h-5 w-5"
              aria-hidden="true"
              data-testid="library-status-icon"
            />
            <Badge variant="secondary" className="text-sm">
              {config.label}
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
