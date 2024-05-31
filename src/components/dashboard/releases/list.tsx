import type { Game } from "@prisma/client";
import { Calendar } from "lucide-react";
import { getWishlistReleases } from "@/src/entities/game/get-wishlist-releases";
import { AddGame } from "@/src/components/shared/add-game/add-game";
import { cn } from "@/src/shared/lib/tailwind-merge";
import { Badge } from "@/src/shared/ui/badge";

type UpcomingRelease = {
  cover: {
    id: number;
    image_id: string;
  };
  id: number;
  name: string;
  release_dates: Array<{
    human: string;
    id: number;
    platform: { id: number; name: string };
  }>;
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
      className={cn("relative flex flex-col gap-1.5", {
        "hidden md:flex": index >= 3,
      })}
    >
      <p className="font-medium">{release.name}</p>
      <div className="flex items-center gap-1">
        <Badge className="flex h-fit w-fit flex-shrink-0 items-center gap-1">
          <Calendar className="size-3.5" />
          <p>{date.human}</p>
        </Badge>
        <div>
          {release.release_dates.map((platform, index) => (
            <span className="text-xs text-slate-500">
              {platform.platform.name}
              {release.release_dates.length - 1 === index ? "" : ", "}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
export async function ReleasesList() {
  const releases = await getWishlistReleases();

  return (
    <div className="flex w-full flex-col justify-start gap-3">
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
