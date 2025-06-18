import { Badge } from "@/shared/components/badge";
import { FullGameInfoResponse } from "@/shared/types";
import { format, isFuture, parse } from "date-fns";

type MetadataProps = {
  releaseDates: FullGameInfoResponse["release_dates"];
  involvedCompanies: FullGameInfoResponse["involved_companies"];
  aggregatedRating: FullGameInfoResponse["aggregated_rating"];
  themes: FullGameInfoResponse["themes"];
  firstReleaseDate?: Date | null;
};

export function Metadata({
  releaseDates,
  involvedCompanies,
  aggregatedRating,
  themes,
  firstReleaseDate: fReleaseDate,
}: MetadataProps) {
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

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">
          {isFuture(firstReleaseDateToDate) ? "To be released" : "Released"}
        </h3>
        <p className="font-medium">{firstReleaseDate}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Developer</h3>
        <p className="font-medium">{developer || "–"}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Publisher</h3>
        <p className="font-medium">{publisher || "–"}</p>
      </div>

      {aggregatedRating && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Aggregated Rating
          </h3>
          <div
            className={`inline-flex h-10 items-center justify-center rounded px-2 ${
              aggregatedRating >= 75
                ? "bg-green-100 text-green-800"
                : aggregatedRating >= 50
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            <span className="font-bold">{aggregatedRating.toFixed(1)}</span>
          </div>
        </div>
      )}

      {themes && themes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {themes.map((themes) => (
              <Badge key={themes.id} variant="secondary" className="text-xs">
                {themes.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
