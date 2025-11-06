import { Gamepad2 } from "lucide-react";
import Image from "next/image";

import { cn } from "@/shared/lib/ui";

type GameCoverImageProps = {
  imageId?: string | null;
  gameTitle: string;
  className?: string;
};

export const GameCoverImage = ({
  imageId,
  gameTitle,
  className,
}: GameCoverImageProps) => {
  // Check if image ID exists and is not empty
  const hasCover = imageId && imageId.trim() !== "";

  // If no cover, show placeholder
  if (!hasCover) {
    return (
      <div
        className={cn(
          "bg-muted relative flex aspect-[3/4] w-full max-w-sm flex-col items-center justify-center gap-2 overflow-hidden rounded-lg",
          className
        )}
        aria-label="No cover image available"
      >
        <Gamepad2 className="text-muted-foreground h-16 w-16" />
        <p className="text-muted-foreground text-sm font-medium">
          No cover available
        </p>
      </div>
    );
  }

  // Build IGDB image URL from image_id
  const imageUrl = `https://images.igdb.com/igdb/image/upload/t_720p/${imageId}.jpg`;

  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-lg",
        className
      )}
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
