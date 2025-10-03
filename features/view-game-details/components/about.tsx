import { Suspense } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { type FullGameInfoResponse } from "@/shared/types";

import { Expansions } from "./expansions";

type AboutProps = {
  igdbId: number;
  description: string;
  releaseDates: FullGameInfoResponse["release_dates"];
  genres: FullGameInfoResponse["genres"];
};

export function About({
  description,
  releaseDates,
  genres,
  igdbId,
}: AboutProps) {
  const releaseDatesToUniquePlatforms = new Set(
    releaseDates.map((date) => date.platform.name)
  );
  const uniqueReleaseDates = Array.from(releaseDatesToUniquePlatforms);

  return (
    <>
      <p className="text-muted-foreground">{description}</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <h3 className="mb-2 font-medium">Available on</h3>
          <div className="flex flex-wrap gap-2">
            {uniqueReleaseDates?.map((platform) => (
              <Badge key={platform} variant="outline">
                {platform}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-medium">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {genres?.map((genre) => (
              <Badge key={genre.id}>{genre.name}</Badge>
            ))}
          </div>
        </div>
      </div>

      <Suspense fallback={"Fetching expansions and DLCs..."}>
        <Expansions igdbId={igdbId} />
      </Suspense>
    </>
  );
}
