"use client";

import { GameTimeBadge } from "@/src/components/library/game/ui/card/time-badge";
import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/packages/config/site";
import Image from "next/image";
import { useMediaQuery } from "usehooks-ts";

export const ArtworkImage = ({
  imageUrl,
  time,
  title,
}: {
  imageUrl: string;
  time: number;
  title: string;
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <>
        <Image
          alt={`${title} cover art`}
          className="hidden h-full w-full rounded-xl object-cover md:block"
          height={NEXT_IMAGE_SIZES["c-big"].height}
          src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${imageUrl}.png`}
          style={{
            height: "auto",
            maxWidth: "100%",
          }}
          width={NEXT_IMAGE_SIZES["c-big"].width}
        />
        <div className="absolute right-2 top-2 hidden w-fit flex-col items-end gap-1 normal-case md:flex">
          <GameTimeBadge time={time} />
        </div>
      </>
    );
  }

  return (
    <Image
      alt={`${title} cover art`}
      className="h-auto flex-shrink-0 rounded-xl object-cover md:hidden"
      height={NEXT_IMAGE_SIZES["logo"].height}
      src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${imageUrl}.png`}
      width={NEXT_IMAGE_SIZES["logo"].width}
    />
  );
};
