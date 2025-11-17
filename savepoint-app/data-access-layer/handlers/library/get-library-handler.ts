import { LibraryService } from "@/data-access-layer/services/library/library-service";
import { LibraryItemStatus } from "@prisma/client";
import { z } from "zod";

import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import type { HandlerResult, RequestContext } from "../types";
import type { GetLibraryHandlerInput, GetLibraryHandlerOutput } from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.HANDLER]: "GetLibraryHandler" });

const GetLibrarySchema = z.object({
  userId: z.string().cuid(),
  status: z.nativeEnum(LibraryItemStatus).optional(),
  platform: z.string().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "releaseDate", "startedAt", "completedAt"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export async function getLibraryHandler(
  input: GetLibraryHandlerInput,
  context: RequestContext
): Promise<HandlerResult<GetLibraryHandlerOutput>> {
  const { userId, status, platform, search, sortBy, sortOrder } = input;
  logger.info(
    { userId, status, platform, search, sortBy, sortOrder, ip: context.ip },
    "Processing library fetch request"
  );

  const validation = GetLibrarySchema.safeParse(input);
  if (!validation.success) {
    logger.warn(
      { userId, errors: validation.error.errors },
      "Input validation failed"
    );
    return {
      success: false,
      error: validation.error.errors[0]?.message ?? "Invalid input parameters",
      status: HTTP_STATUS.BAD_REQUEST,
    };
  }

  const libraryService = new LibraryService();
  const result = await libraryService.getLibraryItems({
    ...validation.data,
    distinctByGame: true,
  });

  if (!result.success) {
    logger.error(
      { userId, error: result.error },
      "Service failed to fetch library items"
    );
    return {
      success: false,
      error: result.error,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  logger.info(
    { userId, count: result.data.length },
    "Library items fetched successfully"
  );
  return {
    success: true,
    data: result.data,
    status: HTTP_STATUS.OK,
  };
}
