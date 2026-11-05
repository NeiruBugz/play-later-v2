import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { Dialog, DialogPortal } from "@/shared/ui/dialog";

import type { ImageLightboxProps } from "./image-lightbox.type";

export function ImageLightbox({
  images,
  open,
  index,
  onOpenChange,
  onIndexChange,
}: ImageLightboxProps) {
  const count = images.length;
  const safeIndex = Math.min(Math.max(index, 0), Math.max(count - 1, 0));

  React.useEffect(() => {
    if (!open || count === 0) return;
    const wrap = (next: number) => (next + count) % count;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onIndexChange(wrap(safeIndex + 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onIndexChange(wrap(safeIndex - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, count, safeIndex, onIndexChange]);

  if (count === 0) return null;

  const current = images[safeIndex];
  const goNext = () => onIndexChange((safeIndex + 1) % count);
  const goPrev = () => onIndexChange((safeIndex - 1 + count) % count);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogPrimitive.Backdrop className="data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 fixed inset-0 z-50 bg-black/85 backdrop-blur-sm" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 p-6 focus:outline-none">
          <DialogPrimitive.Title className="sr-only">
            {current.alt}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Screenshot {safeIndex + 1} of {images.length}
          </DialogPrimitive.Description>

          <DialogPrimitive.Close
            aria-label="Close"
            className="bg-foreground/15 text-background hover:bg-foreground/25 absolute top-[max(1rem,env(safe-area-inset-top))] right-4 flex size-11 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>

          <div className="relative w-full max-w-3xl">
            <img
              src={current.src}
              alt={current.alt}
              className="aspect-video w-full rounded-lg object-cover"
            />
            <NavArrow side="left" onClick={goPrev} />
            <NavArrow side="right" onClick={goNext} />
          </div>

          <div className="flex max-w-full gap-2 overflow-x-auto pb-[env(safe-area-inset-bottom)]">
            {images.map((image, i) => (
              <button
                key={image.src}
                type="button"
                aria-label={`View screenshot ${i + 1}`}
                aria-current={i === safeIndex}
                onClick={() => onIndexChange(i)}
                className={cn(
                  "h-12 w-20 shrink-0 overflow-hidden rounded-md transition-opacity",
                  i === safeIndex
                    ? "ring-2 ring-white"
                    : "opacity-55 hover:opacity-100"
                )}
              >
                <img
                  src={image.src}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}

function NavArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous screenshot" : "Next screenshot"}
      onClick={onClick}
      className={cn(
        "bg-foreground/40 text-background hover:bg-foreground/60 absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none",
        side === "left" ? "left-3" : "right-3"
      )}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
}
