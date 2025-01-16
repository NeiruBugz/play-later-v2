import { BacklogItemCard } from "@/slices/shared/widgets/backlog-item-card";
import {
  cn,
  platformMapper,
  platformToBackgroundColor,
} from "@/src/shared/lib";
import { Badge } from "@/src/shared/ui/badge";
import { Calendar } from "lucide-react";
import { cache } from "react";
import { getUpcomingWishlistItems } from "slices/backlog/api";

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
const isNewCard = true;

const Release = ({
  index,
  release,
}: {
  gameId: number;
  index: number;
  release: UpcomingRelease;
}) => {
  const date = release.release_dates?.[0];

  if (isNewCard) {
    return (
      <div className="group relative flex-shrink-0">
        <div>
          <BacklogItemCard
            game={{
              id: String(release.id),
              title: release.name,
              coverImage: release.cover.image_id,
              igdbId: release.id,
            }}
            backlogItems={[]}
            hasActions={false}
            isExternalGame
            isUpcomingGame
          />
        </div>
        <div className="invisible absolute bottom-0 w-full rounded-b-lg bg-slate-500/60 p-2 group-hover:visible">
          <h3 className="my-1 text-base font-semibold text-white">
            {release.name}
          </h3>
          <Badge className="flex h-fit w-fit flex-shrink-0 items-center gap-1">
            <Calendar className="size-3.5" />
            <p>{date.human}</p>
          </Badge>
          <div className="mt-1 flex flex-wrap gap-1">
            {release.release_dates.map((platform, index) => (
              <span
                className={cn(
                  "rounded-md bg-slate-400 px-2 py-1 text-xs font-medium text-white",
                  {},
                  platformToBackgroundColor(platform.platform.name)
                )}
                key={platform.id}
              >
                {platformMapper(platform.platform.name)}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative flex flex-col gap-1.5", {
        "hidden md:flex": index >= 3,
      })}
    >
      <p className="font-medium">{release.name}</p>
      <div className="flex flex-col-reverse items-start gap-1">
        <Badge className="flex h-fit w-fit flex-shrink-0 items-center gap-1">
          <Calendar className="size-3.5" />
          <p>{date.human}</p>
        </Badge>
        <div>
          {release.release_dates.map((platform, index) => (
            <span className="text-xs text-slate-500" key={platform.id}>
              {platform.platform.name}
              {release.release_dates.length - 1 === index ? "" : ", "}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const getReleases = cache(async () => await getUpcomingWishlistItems());

export async function ReleasesList() {
  const releases = await getReleases();

  return (
    <div className="flex w-full max-w-[420px] justify-start gap-3 overflow-x-auto">
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
        </div>
      )}
    </div>
  );
}
