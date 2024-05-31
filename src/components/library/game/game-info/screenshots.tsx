import type { FullGameInfoResponse } from "@/src/shared/types/igdb";

import { CustomImage } from "@/src/shared/ui/custom-image";

export const Screenshots = ({
  name,
  screenshots,
}: {
  name: string;
  screenshots: FullGameInfoResponse["screenshots"];
}) => (
  <section className="container mx-auto hidden py-4 md:block md:py-6">
    <div className="flex flex-wrap items-center gap-4">
      {screenshots.map((screenshot) => {
        return (
          <div
            className="relative mx-4 aspect-[16/9] h-[320px] w-[569px] cursor-pointer border transition"
            key={screenshot.id}
          >
            <CustomImage
              alt={`${name} screenshot ${screenshot.image_id}`}
              className="object-cover"
              imageUrl={screenshot.image_id}
              priority
              size="s-md"
            />
          </div>
        );
      })}
    </div>
  </section>
);
