import { getSystemPlatforms } from "@/data-access-layer/services/platform/platform-service";
import { cacheLife, cacheTag } from "next/cache";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import type { UniquePlatformResult } from "@/shared/types/platform";

import type { HandlerResult, RequestContext } from "../types";

const logger = createLogger({
  [LOGGER_CONTEXT.HANDLER]: "GetUniquePlatformsHandler",
});

const PLATFORMS_REVALIDATE_SECONDS = 86400;

async function getCachedUniquePlatforms(): Promise<{
  platforms: UniquePlatformResult[];
}> {
  "use cache";
  cacheLife({ revalidate: PLATFORMS_REVALIDATE_SECONDS });
  cacheTag("platforms:unique");

  logger.info("Unique platforms cache miss - fetching from service");

  const result = await getSystemPlatforms();

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}

export async function getUniquePlatformsHandler(
  _: unknown,
  context: RequestContext
): Promise<HandlerResult<{ platforms: UniquePlatformResult[] }>> {
  logger.info({ ip: context.ip }, "Processing unique platforms fetch request");

  try {
    const data = await getCachedUniquePlatforms();

    logger.info(
      { platforms: data.platforms.length },
      "Unique platforms fetched successfully"
    );
    return {
      success: true,
      data,
      status: HTTP_STATUS.OK,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch unique platforms";

    logger.error({ error }, "Failed to fetch unique platforms");

    return {
      success: false,
      error: message,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }
}
