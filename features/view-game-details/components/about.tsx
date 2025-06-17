import { Badge } from "@/shared/components/badge";
import { FullGameInfoResponse } from "@/shared/types";
import { Suspense } from "react";
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
  return (
    <>
      <p className="text-muted-foreground">{description}</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <h3 className="mb-2 font-medium">Available on</h3>
          <div className="flex flex-wrap gap-2">
            {releaseDates &&
              releaseDates.map((releaseDate) => (
                <Badge key={releaseDate.id} variant="outline">
                  {releaseDate.platform.name}
                </Badge>
              ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-medium">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {genres &&
              genres.map((genre) => <Badge key={genre.id}>{genre.name}</Badge>)}
          </div>
        </div>
      </div>

      <Suspense fallback={"Fetching expansions and DLCs..."}>
        <Expansions igdbId={igdbId} />
      </Suspense>
    </>
  );
}
