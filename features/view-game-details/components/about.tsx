import { format, isFuture, parse } from "date-fns";
import { Suspense } from "react";

import { Body, Caption, Heading } from "@/shared/components/typography";
import { Badge } from "@/shared/components/ui/badge";
import { type FullGameInfoResponse } from "@/shared/types";

import { Expansions } from "./expansions";

type AboutProps = {
  igdbId: number;
  releaseDates: FullGameInfoResponse["release_dates"];
  genres: FullGameInfoResponse["genres"];
  involvedCompanies: FullGameInfoResponse["involved_companies"];
  aggregatedRating: FullGameInfoResponse["aggregated_rating"];
  themes: FullGameInfoResponse["themes"];
  firstReleaseDate?: Date | null;
};

export function About({
  releaseDates,
  genres,
  igdbId,
  involvedCompanies,
  aggregatedRating,
  themes,
  firstReleaseDate: fReleaseDate,
}: AboutProps) {
  const releaseDatesToUniquePlatforms = new Set(
    releaseDates.map((date) => date.platform.name)
  );
  const uniqueReleaseDates = Array.from(releaseDatesToUniquePlatforms);

  const firstReleaseDate = fReleaseDate
    ? format(fReleaseDate, "dd.MM.yyyy")
    : releaseDates[0].human;
  const developer =
    involvedCompanies?.find((company) => company.developer)?.company.name ??
    "Unknown";
  const publisher =
    involvedCompanies?.find((company) => company.publisher)?.company.name ??
    "Unknown";

  const firstReleaseDateToDate = fReleaseDate
    ? parse(firstReleaseDate, "dd.MM.yyyy", new Date())
    : parse(firstReleaseDate, "MMM dd, yyyy", new Date());

  const getRatingColorClass = (rating: number) => {
    if (rating >= 75) return "text-success";
    if (rating >= 50) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Heading level={3} size="md" className="mb-2">
            Available on
          </Heading>
          <div className="flex flex-wrap gap-2">
            {uniqueReleaseDates?.map((platform) => (
              <Badge key={platform} variant="outline">
                {platform}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Heading level={3} size="md" className="mb-2">
            Genres
          </Heading>
          <div className="flex flex-wrap gap-2">
            {genres?.map((genre) => <Badge key={genre.id}>{genre.name}</Badge>)}
          </div>
        </div>
      </div>

      {/* Metadata content moved from metadata.tsx */}
      <div className="space-y-4 rounded-lg border p-4">
        <div>
          <Caption size="sm">
            {isFuture(firstReleaseDateToDate) ? "To be released" : "Released"}
          </Caption>
          <Body size="sm" className="font-medium">
            {firstReleaseDate}
          </Body>
        </div>

        <div>
          <Caption size="sm">Developer</Caption>
          <Body size="sm" className="font-medium">
            {developer || "–"}
          </Body>
        </div>

        <div>
          <Caption size="sm">Publisher</Caption>
          <Body size="sm" className="font-medium">
            {publisher || "–"}
          </Body>
        </div>

        {aggregatedRating && (
          <div>
            <Caption size="sm">Aggregated Rating</Caption>
            <div
              className={`inline-flex h-8 items-center justify-center rounded bg-muted px-2`}
            >
              <Body
                size="sm"
                className={`font-bold ${getRatingColorClass(aggregatedRating)}`}
              >
                {aggregatedRating.toFixed(1)}
              </Body>
            </div>
          </div>
        )}

        {themes && themes.length > 0 && (
          <div>
            <Caption size="sm">Tags</Caption>
            <div className="mt-1 flex flex-wrap gap-1">
              {themes.map((theme) => (
                <Badge key={theme.id} variant="secondary" size="sm">
                  {theme.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={"Fetching expansions and DLCs..."}>
        <Expansions igdbId={igdbId} />
      </Suspense>
    </div>
  );
}
