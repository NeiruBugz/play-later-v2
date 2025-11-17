import { PlatformService } from "@/data-access-layer/services/platform/platform-service";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { UniquePlatformResult } from "@/shared/types/platform";

import type { HandlerResult, RequestContext } from "../types";

const logger = createLogger({
  [LOGGER_CONTEXT.HANDLER]: "GetUniquePlatformsHandler",
});

export async function getUniquePlatformsHandler(
  _: unknown,
  context: RequestContext
): Promise<HandlerResult<{ platforms: UniquePlatformResult[] }>> {
  logger.info({ ip: context.ip }, "Processing unique platforms fetch request");

  const platformService = new PlatformService();
  const result = await platformService.getSystemPlatforms();

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  logger.info(
    { platforms: result.data.platforms.length },
    "Unique platforms fetched successfully"
  );
  return {
    success: true,
    data: result.data,
    status: HTTP_STATUS.OK,
  };
}
