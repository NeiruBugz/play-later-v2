import { getServerUserId } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { steamImportConfig } from "@/features/steam-import/config";
import { triggerBackgroundSync } from "@/features/steam-import/server-actions";
import { HTTP_STATUS } from "@/shared/config/http-codes";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({ [LOGGER_CONTEXT.API_ROUTE]: "steam-sync" });

const RequestBodySchema = z.object({
  type: z.enum(["FULL_SYNC", "INCREMENTAL_SYNC"]).default("FULL_SYNC"),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      logger.warn("Unauthorized Steam sync attempt");
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    logger.info(
      {
        userId,
        isBackgroundSyncEnabled: steamImportConfig.isBackgroundSyncEnabled,
      },
      "Steam sync request received"
    );

    if (!steamImportConfig.isBackgroundSyncEnabled) {
      logger.warn({ userId }, "Steam sync attempted but feature is disabled");
      return NextResponse.json(
        { success: false, error: "Background sync is not currently available" },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    const body = await request.json();
    const parseResult = RequestBodySchema.safeParse(body);

    if (!parseResult.success) {
      logger.warn(
        { userId, error: parseResult.error },
        "Invalid request body for Steam sync"
      );
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { type } = parseResult.data;

    logger.info({ userId, syncType: type }, "Triggering Steam background sync");

    const result = await triggerBackgroundSync({ type });

    if (!result.success) {
      logger.error(
        { userId, error: result.error },
        "Failed to trigger Steam sync"
      );
      return NextResponse.json(
        { success: false, error: result.error },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    logger.info(
      { userId, syncType: type },
      "Steam background sync triggered successfully"
    );

    return NextResponse.json({
      success: true,
      message: "Steam library sync has been queued",
    });
  } catch (error) {
    logger.error(
      { err: error, url: request.url },
      "Unexpected error in Steam sync API"
    );
    return NextResponse.json(
      {
        success: false,
        error:
          "Steam sync service is temporarily unavailable. Please try again later.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
