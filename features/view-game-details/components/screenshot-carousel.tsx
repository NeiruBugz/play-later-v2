"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

import { IgdbImage } from "@/shared/components/igdb-image";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { type FullGameInfoResponse } from "@/shared/types";

export function ScreenshotCarousel({
  screenshots,
  gameName,
}: {
  screenshots: FullGameInfoResponse["screenshots"];
  gameName: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {screenshots.map((screenshot, index) => (
          <Dialog
            key={screenshot.id}
            open={open && currentIndex === index}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (isOpen) setCurrentIndex(index);
            }}
          >
            <DialogTrigger asChild>
              <div className="group relative aspect-video cursor-pointer overflow-hidden rounded-md border">
                <IgdbImage
                  gameTitle={gameName}
                  coverImageId={screenshot.image_id}
                  igdbSrcSize="hd"
                  igdbImageSize="hd"
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-7xl border-none bg-transparent p-0">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 z-50 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  <X className="size-4" />
                </Button>
                <div className="relative aspect-video">
                  <IgdbImage
                    gameTitle={gameName}
                    coverImageId={screenshots[currentIndex].image_id}
                    igdbSrcSize="full-hd"
                    igdbImageSize="full-hd"
                    fill
                    className="object-contain"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 z-50 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="size-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 z-50 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={handleNext}
                >
                  <ChevronRight className="size-6" />
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
