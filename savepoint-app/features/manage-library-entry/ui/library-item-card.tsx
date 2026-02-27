"use client";

import { CalendarIcon, CheckCircleIcon, PlayIcon, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { formatAbsoluteDate } from "@/shared/lib/date";
import { getStatusLabel, getStatusVariant } from "@/shared/lib/library-status";

import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import type { LibraryItemCardProps } from "./library-item-card.types";

export const LibraryItemCard = ({
  item,
  onClick,
  onDelete,
}: LibraryItemCardProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };
  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(item.id);
    }
  };
  return (
    <>
      <Card
        className={`transition-shadow ${onClick ? "cursor-pointer hover:shadow-md" : ""}`}
        onClick={handleCardClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        <CardContent className="p-xl">
          <div className="space-y-lg">
            {}
            <div className="gap-md flex items-center justify-between">
              <div className="gap-md flex items-center">
                <span className="text-sm font-medium" aria-label="Platform">
                  {item.platform
                    ? `🎮 ${item.platform}`
                    : "🎮 Platform not set"}
                </span>
              </div>
              <div className="gap-md flex items-center">
                <Badge variant={getStatusVariant(item.status)}>
                  {getStatusLabel(item.status)}
                </Badge>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteClick}
                    aria-label={`Delete ${item.platform || "library"} entry`}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            {}
            <div className="text-muted-foreground space-y-sm text-sm">
              {}
              <div className="gap-md flex items-center">
                <PlayIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  Started:{" "}
                  {item.startedAt ? (
                    <time dateTime={item.startedAt.toISOString()}>
                      {formatAbsoluteDate(item.startedAt)}
                    </time>
                  ) : (
                    <span className="text-muted-foreground">Not started</span>
                  )}
                </span>
              </div>
              {}
              <div className="gap-md flex items-center">
                <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  Completed:{" "}
                  {item.completedAt ? (
                    <time dateTime={item.completedAt.toISOString()}>
                      {formatAbsoluteDate(item.completedAt)}
                    </time>
                  ) : (
                    <span className="text-muted-foreground">Not yet</span>
                  )}
                </span>
              </div>
            </div>
            {}
            <div className="text-muted-foreground gap-xs flex items-center text-xs">
              <CalendarIcon className="h-3 w-3" aria-hidden="true" />
              <span>
                Added:{" "}
                <time dateTime={item.createdAt.toISOString()}>
                  {formatAbsoluteDate(item.createdAt)}
                </time>
              </span>
              <span className="mx-xs">•</span>
              <span>
                Updated:{" "}
                <time dateTime={item.updatedAt.toISOString()}>
                  {formatAbsoluteDate(item.updatedAt)}
                </time>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        itemDescription={item.platform || "library"}
      />
    </>
  );
};
