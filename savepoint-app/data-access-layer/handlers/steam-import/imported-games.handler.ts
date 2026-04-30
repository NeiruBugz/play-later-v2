import { ImportedGameService } from "@/data-access-layer/services";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { mapErrorToHandlerResult } from "../map-error";
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
    showAlreadyImported = false,
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
      showAlreadyImported,
    },
    "Fetching imported games"
  );

  try {
    const importedGameService = new ImportedGameService();
    const {
      items,
      total,
      page: resultPage,
      limit: resultLimit,
      totalPages,
    } = await importedGameService.findByUserId({
      userId,
      page: validatedPage,
      limit: validatedLimit,
      search,
      playtimeStatus,
      playtimeRange,
      platform,
      lastPlayed,
      sortBy,
      showAlreadyImported,
    });

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
  } catch (error) {
    return mapErrorToHandlerResult(error);
  }
}
