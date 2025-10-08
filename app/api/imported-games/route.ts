import { getServerUserId } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";

import { SearchParamsSchema } from "@/features/view-imported-games/validation/search-params-schema";
import {
  getFilteredImportedGames,
  getFilteredImportedGamesCount,
} from "@/shared/lib/repository";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    // Get authenticated user ID
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Validate request parameters
    const parsedInput = SearchParamsSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search") ?? undefined,
      storefront: searchParams.get("storefront") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? "name",
      sortOrder: searchParams.get("sortOrder") ?? "asc",
    });

    if (!parsedInput.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          details: parsedInput.error.format(),
        },
        { status: 400 }
      );
    }

    const { page, limit, search, storefront, sortBy, sortOrder } =
      parsedInput.data;

    // Build where clause for filtering
    const where = {
      userId,
      ...(storefront && { storefront }),
      ...(search && {
        name: {
          contains: search,
          mode: "insensitive" as const,
        },
      }),
      deletedAt: null,
    };

    // Build orderBy clause for sorting
    const orderBy = (() => {
      switch (sortBy) {
        case "name":
          return { name: sortOrder };
        case "playtime":
          return { playtime: sortOrder };
        case "storefront":
          return { storefront: sortOrder };
        case "createdAt":
          return { createdAt: sortOrder };
        default:
          return { name: sortOrder };
      }
    })();

    // Fetch data
    const [totalGames, games] = await Promise.all([
      getFilteredImportedGamesCount({ whereClause: where }),
      getFilteredImportedGames({
        whereClause: where,
        page,
        limit,
        orderBy,
      }),
    ]);

    return NextResponse.json({
      games,
      totalGames,
      page,
      limit,
    });
  } catch (error) {
    console.error("Failed to fetch imported games:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch imported games",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
