import { getServerUserId } from "@/auth";
import { CollectionService } from "@/data-access-layer/services";
import { NextResponse } from "next/server";

import { createLogger } from "@/shared/lib/app";
import { FilterParamsSchema } from "@/shared/types";

const logger = createLogger({ name: "GetCollectionAPIRoute" });

export async function GET(request: Request) {
  const userId = await getServerUserId();

  if (!userId) {
    logger.warn("Unauthorized collection access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unparsedQuery = Object.fromEntries(searchParams.entries());
  const parsedQuery = FilterParamsSchema.safeParse(unparsedQuery);

  if (!parsedQuery.success) {
    logger.warn({ err: parsedQuery.error, userId }, "Invalid query parameters");
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 }
    );
  }

  logger.info({ userId, query: parsedQuery.data }, "Get Collection requested");

  const collectionService = new CollectionService();
  const result = await collectionService.getCollection({
    userId,
    ...parsedQuery.data,
  });

  if (!result.success) {
    logger.error(
      { err: result.error, userId, query: parsedQuery.data },
      "Fetching collection failed"
    );
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  logger.info(
    { userId, query: parsedQuery.data },
    "Collection fetched successfully"
  );

  return NextResponse.json({
    collection: result.data?.collection,
    count: result.data?.count,
  });
}
