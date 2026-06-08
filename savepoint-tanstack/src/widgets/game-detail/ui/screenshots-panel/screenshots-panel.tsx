import { useState } from "react";

import { buildScreenshotUrl } from "@/shared/lib/igdb-image";
import { ImageLightbox } from "@/shared/ui/image-lightbox";

import type { ScreenshotsPanelProps } from "./screenshots-panel.type";

export function ScreenshotsPanel({
  screenshots,
  gameTitle,
}: ScreenshotsPanelProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!screenshots || screenshots.length === 0) return null;

  const images = screenshots
    .map((shot, i) => ({
      thumb: buildScreenshotUrl(shot.image_id, "t_720p"),
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
    >
      <h2
        id="screenshots-heading"
        className="text-muted-foreground mb-md font-mono text-xs tracking-wider uppercase"
      >
        Screenshots
      </h2>

      <div className="gap-sm flex overflow-x-auto md:grid md:grid-cols-5 md:overflow-visible">
        {images.map((image, i) => (
          <button
            key={image.full}
            type="button"
            aria-label={`Open screenshot ${i + 1}`}
            onClick={() => setActiveIndex(i)}
            className="ring-offset-background focus-visible:ring-ring w-48 shrink-0 overflow-hidden rounded-md leading-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:w-auto"
          >
            <img
              src={image.thumb}
              alt=""
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
