import { Gamepad2 } from "lucide-react";
import Image from "next/image";

import { cn } from "@/shared/lib/ui";

import type { GameCoverImageProps } from "./game-cover-image.types";

export const GameCoverImage = ({
  imageId,
  gameTitle,
  className,
}: GameCoverImageProps) => {
  const hasCover = imageId && imageId.trim() !== "";

  if (!hasCover) {
    return (
      <div
        className={cn(
          "bg-muted relative flex aspect-[3/4] w-full max-w-sm flex-col items-center justify-center gap-md overflow-hidden rounded-lg",
          className
        )}
        aria-label="No cover image available"
        data-testid="game-cover-placeholder"
      >
        <Gamepad2
          className="text-muted-foreground h-16 w-16"
          data-testid="game-cover-icon"
        />
        <p className="text-muted-foreground text-sm font-medium">
          No cover available
        </p>
      </div>
    );
  }

  const imageUrl = `https://images.igdb.com/igdb/image/upload/t_720p/${imageId}.jpg`;
  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-lg",
        className
      )}
      data-testid="game-cover-image"
    >
      <Image
        src={imageUrl}
        alt={`${gameTitle} cover`}
        fill
        className="object-cover"
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 384px"
      />
    </div>
  );
};
