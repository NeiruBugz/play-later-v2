"use client";

import Image from "next/image";
import { useMediaQuery } from "usehooks-ts";

import { IMAGE_API, IMAGE_SIZES, NEXT_IMAGE_SIZES } from "@/lib/config/site";

import { GameTimeBadge } from "@/app/(protected)/library/components/game/ui/card/time-badge";

export const ArtworkImage = ({
  imageUrl,
  title,
  time,
}: {
  title: string;
  time: number;
  imageUrl: string;
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <>
        <Image
          src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${imageUrl}.png`}
          alt={`${title} cover art`}
          width={NEXT_IMAGE_SIZES["c-big"].width}
          height={NEXT_IMAGE_SIZES["c-big"].height}
          style={{
            maxWidth: "100%",
            height: "auto",
          }}
          className="hidden h-full w-full rounded-xl object-cover md:block"
        />
        <div className="absolute right-2 top-2 hidden w-fit flex-col items-end gap-1 normal-case md:flex">
          <GameTimeBadge time={time} />
        </div>
      </>
    );
  }

  return (
    <Image
      src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${imageUrl}.png`}
      alt={`${title} cover art`}
      width={NEXT_IMAGE_SIZES["logo"].width}
      height={NEXT_IMAGE_SIZES["logo"].height}
      className="h-auto flex-shrink-0 rounded-xl object-cover md:hidden"
    />
  );
};
