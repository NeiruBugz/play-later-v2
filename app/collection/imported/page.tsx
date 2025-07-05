import { Storefront } from "@prisma/client";

import { ImportedGames } from "@/features/view-imported-games";
import { getImportedGames } from "@/features/view-imported-games/server-actions/get-imported-games";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/breadcrumb";
import { CollectionNav } from "@/shared/components/collection-nav";
import { Header } from "@/shared/components/header";

interface SearchParams {
  page?: string;
  limit?: string;
  search?: string;
  storefront?: string;
  sortBy?: string;
  sortOrder?: string;
}

export default async function ImportedGamesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Parse and validate search parameters
  const page = parseInt(params.page || "1") || 1;
  const limit = parseInt(params.limit || "20") || 20;
  const search = params.search || undefined;
  const storefront = (params.storefront as Storefront) || undefined;
  const sortBy =
    (params.sortBy as "name" | "playtime" | "storefront" | "createdAt") ||
    "name";
  const sortOrder = (params.sortOrder as "asc" | "desc") || "asc";

  const { data, serverError, validationErrors } = await getImportedGames({
    page,
    limit,
    search,
    storefront,
    sortBy,
    sortOrder,
  });

  if (serverError) {
    return (
      <>
        <Header />
        <div className="container overflow-hidden px-4 py-8 pt-16">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 text-6xl">❌</div>
            <h2 className="mb-2 text-xl font-semibold">
              Error loading imported games
            </h2>
            <p className="text-muted-foreground">{serverError}</p>
          </div>
        </div>
      </>
    );
  }

  if (validationErrors) {
    return (
      <>
        <Header />
        <div className="container overflow-hidden px-4 py-8 pt-16">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="mb-2 text-xl font-semibold">Validation Error</h2>
            <pre className="text-sm text-muted-foreground">
              {JSON.stringify(validationErrors, null, 2)}
            </pre>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Header />
        <div className="container overflow-hidden px-4 py-8 pt-16">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 text-6xl">🚫</div>
            <h2 className="mb-2 text-xl font-semibold">No data available</h2>
            <p className="text-muted-foreground">
              Unable to load imported games
            </p>
          </div>
        </div>
      </>
    );
  }

  const { games, totalGames } = data;

  return (
    <>
      <Header />
      <div className="container overflow-hidden px-4 py-8 pt-16">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/collection">Collection</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Imported Games</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <CollectionNav />
        </div>

        <ImportedGames
          initialGames={games}
          initialTotalGames={totalGames}
          initialPage={page}
          limit={limit}
        />
      </div>
    </>
  );
}
