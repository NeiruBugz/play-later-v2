import { ImportedGames } from "@/features/view-imported-games";
import { getImportedGames } from "@/features/view-imported-games/server-actions";
import { SearchParamsSchema } from "@/features/view-imported-games/validation/search-params-schema";

type SearchParams = {
  page?: string;
  limit?: string;
  search?: string;
  storefront?: string;
  sortBy?: string;
  sortOrder?: string;
};

export default async function ImportedGamesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const { page, limit, search, storefront, sortBy, sortOrder } =
    SearchParamsSchema.parse(params);

  const { data, serverError, validationErrors } = await getImportedGames({
    page,
    limit,
    search,
    storefront,
    sortBy,
    sortOrder,
  });

  if (serverError != null) {
    return (
      <div className="container overflow-hidden px-4 py-8 pt-16">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 text-6xl">❌</div>
          <h2 className="mb-2 text-xl font-semibold">
            Error loading imported games
          </h2>
          <p className="text-muted-foreground">{serverError}</p>
        </div>
      </div>
    );
  }

  if (validationErrors != null) {
    return (
      <div className="container overflow-hidden px-4 py-8 pt-16">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold">Validation Error</h2>
          <pre className="text-sm text-muted-foreground">
            {JSON.stringify(validationErrors, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  if (data == null) {
    return (
      <div className="container overflow-hidden px-4 py-8 pt-16">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 text-6xl">🚫</div>
          <h2 className="mb-2 text-xl font-semibold">No data available</h2>
          <p className="text-muted-foreground">Unable to load imported games</p>
        </div>
      </div>
    );
  }

  const { games, totalGames } = data;

  return (
    <ImportedGames
      initialGames={games}
      initialTotalGames={totalGames}
      initialPage={page}
      limit={limit}
    />
  );
}
