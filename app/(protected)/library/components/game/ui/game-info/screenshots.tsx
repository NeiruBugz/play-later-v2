import Image from "next/image";

import { IMAGE_API, IMAGE_SIZES } from "@/lib/config/site";
import { FullGameInfoResponse } from "@/lib/types/igdb";

export const Screenshots = ({
  screenshots,
  name,
}: {
  screenshots: FullGameInfoResponse["screenshots"];
  name: string;
}) => (
  <section className="container mx-auto hidden py-4 md:block md:py-6">
    <div className="flex flex-wrap items-center gap-4">
      {screenshots.map((screenshot) => {
        return (
          <div
            key={screenshot.id}
            className="relative mx-4 aspect-[16/9] h-[320px] w-[569px] cursor-pointer border transition"
          >
            <Image
              src={`${IMAGE_API}/${IMAGE_SIZES["s-md"]}/${screenshot.image_id}.png`}
              alt={`${name} screenshot ${screenshot.image_id}`}
              className="object-cover"
              height={320}
              width={569}
              priority
            />
          </div>
        );
      })}
    </div>
  </section>
);
