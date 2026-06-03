import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { ImageLightboxProps } from "./image-lightbox.type";

export function ImageLightbox({
  images,
  open,
  index,
  onOpenChange,
  onIndexChange,
}: ImageLightboxProps) {
  if (images.length === 0) return null;

  const safeIndex = Math.min(Math.max(index, 0), images.length - 1);
  const current = images[safeIndex];

  const wrap = (next: number) => (next + images.length) % images.length;

  const goNext = () => onIndexChange(wrap(safeIndex + 1));
  const goPrev = () => onIndexChange(wrap(safeIndex - 1));

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/85 backdrop-blur-sm" />
        <DialogPrimitive.Content
          onKeyDown={handleKeyDown}
          className="gap-lg p-2xl fixed inset-0 z-50 flex flex-col items-center justify-center focus:outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            {current.alt}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Screenshot {safeIndex + 1} of {images.length}
          </DialogPrimitive.Description>

          <DialogPrimitive.Close
            aria-label="Close"
            className="bg-foreground/15 text-background hover:bg-foreground/25 absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
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

          <div className="flex max-w-full gap-2 overflow-x-auto">
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
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
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
