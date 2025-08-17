import { NextRequest, NextResponse } from "next/server";

import { getUserGamesWithGroupedBacklogPaginated } from "@/features/view-collection";
import { FilterParamsSchema } from "@/features/view-collection/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    const parsedInput = FilterParamsSchema.safeParse({
      platform: searchParams.get("platform") || "",
      status: searchParams.get("status") || "",
      search: searchParams.get("search") || "",
      page: Number(searchParams.get("page")) || 1,
    });

    if (parsedInput.error) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          cause: parsedInput.error,
        },
        { status: 400 }
      );
    }

    const serverActionResult = await getUserGamesWithGroupedBacklogPaginated({
      platform: parsedInput.data.platform,
      status: parsedInput.data.status,
      search: parsedInput.data.search,
      page: parsedInput.data.page,
    });

    if (serverActionResult.serverError) {
      return NextResponse.json(
        {
          error: "Failed to get collection",
          cause: serverActionResult.serverError,
        },
        { status: 500 }
      );
    }

    if (serverActionResult.validationErrors) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          cause: serverActionResult.validationErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(serverActionResult.data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get collection", cause: error },
      { status: 500 }
    );
  }
}
