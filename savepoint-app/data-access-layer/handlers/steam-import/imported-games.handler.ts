import { ImportedGameService } from "@/data-access-layer/services";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import type { HandlerResult } from "../types";
import type {
  ImportedGamesHandlerInput,
  ImportedGamesHandlerOutput,
} from "./types";

const logger = createLogger({
  [LOGGER_CONTEXT.HANDLER]: "ImportedGamesHandler",
});

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export async function importedGamesHandler(
  input: ImportedGamesHandlerInput
): Promise<HandlerResult<ImportedGamesHandlerOutput>> {
  const {
    userId,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    search,
    playtimeStatus,
    playtimeRange,
    platform,
    lastPlayed,
    sortBy,
  } = input;

  const validatedPage = Math.max(1, page);
  const validatedLimit = Math.min(Math.max(1, limit), MAX_LIMIT);

  logger.info(
    {
      userId,
      page: validatedPage,
      limit: validatedLimit,
      search,
      playtimeStatus,
      playtimeRange,
      platform,
      lastPlayed,
      sortBy,
    },
    "Fetching imported games"
  );

  const importedGameService = new ImportedGameService();
  const result = await importedGameService.findByUserId({
    userId,
    page: validatedPage,
    limit: validatedLimit,
    search,
    playtimeStatus,
    playtimeRange,
    platform,
    lastPlayed,
    sortBy,
  });

  if (!result.success) {
    logger.error(
      { userId, error: result.error },
      "Failed to fetch imported games"
    );
    return {
      success: false,
      error: "Failed to fetch imported games. Please try again.",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  const {
    items,
    total,
    page: resultPage,
    limit: resultLimit,
    totalPages,
  } = result.data;

  logger.info(
    { userId, total, page: resultPage, totalPages },
    "Successfully fetched imported games"
  );

  return {
    success: true,
    data: {
      games: items,
      pagination: {
        page: resultPage,
        limit: resultLimit,
        total,
        totalPages,
      },
    },
    status: HTTP_STATUS.OK,
  };
}
