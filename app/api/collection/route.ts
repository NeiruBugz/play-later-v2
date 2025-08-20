import { getServerUserId } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";

import { FilterParamsSchema } from "@/features/view-collection/lib/validation";
import { CollectionService } from "@/shared/services";

const collectionService = new CollectionService();

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
    const parsedInput = FilterParamsSchema.safeParse({
      platform: searchParams.get("platform") ?? "",
      status: searchParams.get("status") ?? "",
      search: searchParams.get("search") ?? "",
      page: Number(searchParams.get("page")) ?? 1,
    });

    if (!parsedInput.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          cause: parsedInput.error,
        },
        { status: 400 }
      );
    }

    // Call service layer
    const result = await collectionService.getCollection({
      userId,
      platform: parsedInput.data.platform,
      status: parsedInput.data.status,
      search: parsedInput.data.search,
      page: parsedInput.data.page,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get collection", cause: error },
      { status: 500 }
    );
  }
}
