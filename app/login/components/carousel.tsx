"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { IMAGE_API, IMAGE_SIZES } from "@/lib/config/site";
import { RatedGameResponse } from "@/lib/types/igdb";

export const Carousel = ({
  games,
  interval = 6000,
}: {
  games: Array<RatedGameResponse> | undefined;
  interval?: number;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (games?.length) {
        setCurrentIndex((prevIndex) =>
          prevIndex === games.length - 1 ? 0 : prevIndex + 1
        );
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [currentIndex, games, interval]);

  return (
    <div className="relative w-full overflow-hidden">
      <figure
        className="aspect-album transition-all duration-500 ease-in"
        style={{ transform: `translateX(-${currentIndex * 100})%` }}
      >
        <Image
          src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${games?.[currentIndex].cover.image_id}.png`}
          alt={`${games?.[currentIndex].name} cover`}
          className="h-full w-full rounded-md object-cover "
          width={860}
          height={540}
          priority
        />
        <figcaption className="text-center font-medium">
          {games?.[currentIndex].name}
        </figcaption>
      </figure>
    </div>
  );
};
