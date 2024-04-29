import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/packages/config/site";
import { FullGameInfoResponse } from "@/src/packages/types/igdb";
import Image from "next/image";

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
            <Image
              alt={`${name} screenshot ${screenshot.image_id}`}
              className="object-cover"
              height={NEXT_IMAGE_SIZES["s-md"].height}
              priority
              src={`${IMAGE_API}/${IMAGE_SIZES["s-md"]}/${screenshot.image_id}.png`}
              width={NEXT_IMAGE_SIZES["s-md"].width}
            />
          </div>
        );
      })}
    </div>
  </section>
);
