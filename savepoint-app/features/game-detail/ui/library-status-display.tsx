"use client";

import type { LibraryItem, LibraryItemStatus } from "@prisma/client";
import {
  BookmarkIcon,
  ClockIcon,
  GamepadIcon,
  HeartIcon,
  PauseIcon,
  SparklesIcon,
} from "lucide-react";
import { useState } from "react";

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

import { AddToLibraryButton } from "./add-to-library-button";
import { LibraryModal } from "./library-modal";

type LibraryStatusDisplayProps = {
  userLibraryStatus?: {
    mostRecent: {
      status: LibraryItemStatus;
    };
    updatedAt: Date;
    allItems: LibraryItem[];
  };
  igdbId: number;
  gameTitle: string;
};

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
  userLibraryStatus,
  igdbId,
  gameTitle,
}: LibraryStatusDisplayProps) => {
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // If no library status, show "Add to Library" button
  if (!userLibraryStatus) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Library Status</CardTitle>
          <CardDescription>Add this game to your library</CardDescription>
        </CardHeader>
        <CardContent>
          <AddToLibraryButton igdbId={igdbId} gameTitle={gameTitle} />
        </CardContent>
      </Card>
    );
  }

  // Show library status with "Manage Library" button
  const status = userLibraryStatus.mostRecent.status;
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const updatedDate = formatAbsoluteDate(userLibraryStatus.updatedAt);

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Library Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Icon className="text-primary h-5 w-5" aria-hidden="true" />
            <Badge variant="secondary" className="text-sm">
              {config.label}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Updated: {updatedDate}
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsManageModalOpen(true)}
          >
            Manage Library
          </Button>
        </CardContent>
      </Card>

      <LibraryModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        igdbId={igdbId}
        gameTitle={gameTitle}
        mode="edit"
        existingItems={userLibraryStatus.allItems}
      />
    </>
  );
};
