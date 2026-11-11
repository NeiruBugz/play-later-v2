import { useState } from "react";

import {
  buildScreenshotThumbUrl,
  buildScreenshotUrl,
} from "@/shared/lib/igdb-image";
import { ImageLightbox } from "@/shared/ui/image-lightbox";
import { SectionLabel } from "@/shared/ui/section-label";

import type { ScreenshotsPanelProps } from "./screenshots-panel.type";

export function ScreenshotsPanel({
  screenshots,
  gameTitle,
}: ScreenshotsPanelProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!screenshots || screenshots.length === 0) return null;

  const images = screenshots
    .map((shot, i) => ({
      thumb: buildScreenshotThumbUrl(shot.image_id),
      full: buildScreenshotUrl(shot.image_id, "t_1080p"),
      alt: `Screenshot ${i + 1}`,
    }))
    .filter(
      (image): image is { thumb: string; full: string; alt: string } =>
        image.thumb !== null && image.full !== null
    );

  if (images.length === 0) return null;

  return (
    <section
      aria-labelledby="screenshots-heading"
      aria-label={`Screenshots of ${gameTitle}`}
      className="min-w-0"
    >
      <SectionLabel id="screenshots-heading" className="mb-2">
        Screenshots
      </SectionLabel>

      <div
        data-testid="screenshots-row"
        className="flex snap-x gap-3 overflow-x-auto pb-2"
      >
        {images.map((image, i) => (
          <button
            key={image.full}
            type="button"
            aria-label={`Open screenshot ${i + 1}`}
            onClick={() => setActiveIndex(i)}
            className="w-60 shrink-0 snap-start overflow-hidden rounded-md leading-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none md:w-72"
          >
            <img
              src={image.thumb}
              alt=""
              loading="lazy"
              decoding="async"
              width={569}
              height={320}
              aria-hidden="true"
              className="aspect-video w-full object-cover transition-transform hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      <ImageLightbox
        images={images.map((image) => ({ src: image.full, alt: image.alt }))}
        open={activeIndex !== null}
        index={activeIndex ?? 0}
        onOpenChange={(open) => {
          if (!open) setActiveIndex(null);
        }}
        onIndexChange={setActiveIndex}
      />
    </section>
  );
}
