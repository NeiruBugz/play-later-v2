"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";

import { deleteLibraryItemAction } from "@/features/manage-library-entry/server-actions";
import { LibraryStatusIcon } from "@/shared/components/library-status-icon";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { RatingInput } from "@/shared/components/ui/rating-input";
import { formatAbsoluteDate } from "@/shared/lib/date";
import { getStatusLabel, getStatusVariant } from "@/shared/lib/library-status";

import { AddToLibraryButton } from "./add-to-library-button";
import type { LibraryStatusDisplayProps } from "./library-status-display.types";

const LibraryModal = dynamic(
  () =>
    import("@/features/manage-library-entry/ui").then(
      (mod) => mod.LibraryModal
    ),
  { ssr: false }
);

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
  const rating = userLibraryStatus.mostRecent.rating;
  const statusLabel = getStatusLabel(status);
  const badgeVariant = getStatusVariant(status);
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
          <CardTitle className="text-base font-semibold">
            Library Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-lg">
          <div className="gap-md flex items-center" role="status">
            <Badge
              variant={badgeVariant}
              className="text-sm"
              aria-label={`Status: ${statusLabel}`}
            >
              <LibraryStatusIcon
                status={status}
                className="mr-xs h-3.5 w-3.5"
                aria-hidden="true"
                data-testid="library-status-icon"
              />
              {statusLabel}
            </Badge>
            <RatingInput value={rating} readOnly size="md" />
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
      {isManageModalOpen && (
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
      )}
    </>
  );
};
