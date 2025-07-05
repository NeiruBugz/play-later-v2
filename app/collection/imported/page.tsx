import { ImportedGames } from "@/features/view-imported-games";
import { getImportedGames } from "@/features/view-imported-games/server-actions/get-imported-games";
import { Header } from "@/shared/components/header";

export default async function ImportedGamesPage({
  searchParams,
}: {
  searchParams: Promise<{ page: string; limit: string }>;
}) {
  const { page, limit } = await searchParams;

  const { data, serverError, validationErrors } = await getImportedGames({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });

  if (serverError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-6xl">❌</div>
        <h2 className="mb-2 text-xl font-semibold">
          Error loading imported games
        </h2>
        <p className="text-muted-foreground">{serverError}</p>
      </div>
    );
  }

  if (validationErrors) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-6xl">⚠️</div>
        <h2 className="mb-2 text-xl font-semibold">Validation Error</h2>
        <pre className="text-sm text-muted-foreground">
          {JSON.stringify(validationErrors, null, 2)}
        </pre>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-6xl">🚫</div>
        <h2 className="mb-2 text-xl font-semibold">No data available</h2>
        <p className="text-muted-foreground">Unable to load imported games</p>
      </div>
    );
  }

  const { games, totalGames } = data;

  return (
    <>
      <Header />
      <div className="container overflow-hidden px-4 py-8 pt-16">
        <ImportedGames
          initialGames={games}
          initialTotalGames={totalGames}
          initialPage={parseInt(page) || 1}
          limit={parseInt(limit) || 20}
        />
      </div>
    </>
  );
}
