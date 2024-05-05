import { AddGame } from "@/src/components/shared/add-game/add-game";
import { Badge } from "@/src/components/ui/badge";
import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/packages/config/site";
import { cn } from "@/src/packages/utils";
import { getWishlistReleases } from "@/src/queries/dashboard/get-wishlist-releases";
import { Game } from "@prisma/client";
import { Calendar } from "lucide-react";
import Image from "next/image";

type UpcomingRelease = {
  cover: {
    id: number;
    image_id: string;
  };
  id: number;
  name: string;
  release_dates: Array<{ human: string; id: number }>;
};

const Release = ({
  index,
  release,
}: {
  gameId: Game["id"];
  index: number;
  release: UpcomingRelease;
}) => {
  const date = release.release_dates[0];
  return (
    <div
      className={cn("relative flex flex-col items-center gap-1.5", {
        "hidden md:flex": index >= 3,
      })}
    >
      <Image
        alt={`${release.name} artwork`}
        className="rounded-md object-cover"
        height={NEXT_IMAGE_SIZES["logo"].height}
        priority
        src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${release.cover.image_id}.png`}
        width={NEXT_IMAGE_SIZES["logo"].width}
      />
      <Badge className="flex items-center gap-1">
        <Calendar className="size-3.5" />
        <p>{date.human}</p>
      </Badge>
    </div>
  );
};
export async function ReleasesList() {
  const releases = await getWishlistReleases();

  return (
    <div className="flex w-full justify-center gap-3">
      {releases.length ? (
        releases.map((release, index) => (
          <Release
            gameId={release.gameId}
            index={index}
            key={release.id}
            release={release}
          />
        ))
      ) : (
        <div className="flex flex-col items-center justify-center gap-3">
          <p>
            Your wishlist is empty, add your anticipated or long wanted games!
          </p>
          <AddGame />
        </div>
      )}
    </div>
  );
}
