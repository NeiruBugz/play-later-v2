"use client";

import Link from "next/link";

import { useWhatsNew } from "@/features/whats-new/hooks";
import type { AnnouncementCategory } from "@/features/whats-new/types";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/ui/utils";

const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  feature: "New Feature",
  improvement: "Improvement",
  integration: "Integration",
};

export function WhatsNewModal() {
  const {
    isOpen,
    currentAnnouncement,
    currentIndex,
    totalCount,
    dismiss,
    dismissAll,
  } = useWhatsNew();

  if (!currentAnnouncement) return null;

  const {
    title,
    description,
    category,
    icon: Icon,
    ctaLabel,
    ctaUrl,
  } = currentAnnouncement;
  const isLastAnnouncement = currentIndex === totalCount - 1;
  const hasMultipleAnnouncements = totalCount > 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-sm gap-sm flex items-center">
            <Badge variant="secondary">{CATEGORY_LABELS[category]}</Badge>
            {hasMultipleAnnouncements && (
              <span className="text-muted-foreground text-xs">
                {currentIndex + 1} of {totalCount}
              </span>
            )}
          </div>
          <DialogTitle className="gap-sm flex items-center">
            {Icon && <Icon className="text-primary h-5 w-5" />}
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {hasMultipleAnnouncements && (
          <div className="gap-xs flex justify-center">
            {Array.from({ length: totalCount }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  index === currentIndex ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        )}

        <DialogFooter className="gap-sm sm:gap-sm">
          {hasMultipleAnnouncements && (
            <Button variant="ghost" size="sm" onClick={dismissAll}>
              Dismiss all
            </Button>
          )}
          <div className="gap-sm flex">
            {ctaUrl && ctaLabel && (
              <Button asChild variant="secondary" onClick={dismiss}>
                <Link href={ctaUrl}>{ctaLabel}</Link>
              </Button>
            )}
            <Button onClick={dismiss}>
              {isLastAnnouncement ? "Got it" : "Next"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
