"use server";

import { ProfileService } from "@/data-access-layer/services";
import { env } from "@/env.mjs";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { z } from "zod";

import { createServerAction, type ActionResult } from "@/shared/lib";

import { steamImportConfig } from "../config";

const TriggerSyncSchema = z.object({
  type: z.enum(["FULL_SYNC", "INCREMENTAL_SYNC"]).default("FULL_SYNC"),
});

type TriggerSyncInput = z.infer<typeof TriggerSyncSchema>;

interface SteamSyncMessage {
  userId: string;
  steamId64: string;
  requestedAt: string;
  type: "FULL_SYNC" | "INCREMENTAL_SYNC";
}

export const triggerBackgroundSync = createServerAction<
  TriggerSyncInput,
  { message: string }
>({
  actionName: "triggerBackgroundSync",
  schema: TriggerSyncSchema,
  requireAuth: true,
  handler: async ({
    input,
    userId,
    logger,
  }): Promise<ActionResult<{ message: string }>> => {
    logger.info({ userId }, "Triggering Steam library background sync");

    if (!steamImportConfig.isBackgroundSyncEnabled) {
      logger.warn({ userId }, "Background sync feature is disabled");
      return {
        success: false,
        error: "Background sync is currently disabled. Please try again later.",
      };
    }

    if (!env.STEAM_SYNC_QUEUE_URL) {
      logger.error("STEAM_SYNC_QUEUE_URL is not configured");
      return {
        success: false,
        error: "Background sync is not configured. Please contact support.",
      };
    }

    const profileService = new ProfileService();
    const steamConnectionResult = await profileService.getSteamConnectionStatus(
      {
        userId: userId!,
      }
    );

    if (!steamConnectionResult.success) {
      logger.error(
        { userId, error: steamConnectionResult.error },
        "Failed to fetch Steam connection status"
      );
      return {
        success: false,
        error: "Failed to verify Steam connection. Please try again.",
      };
    }

    if (
      !steamConnectionResult.data.connected ||
      !steamConnectionResult.data.profile
    ) {
      logger.warn({ userId }, "User does not have a connected Steam account");
      return {
        success: false,
        error:
          "You must connect your Steam account before syncing your library.",
      };
    }

    const { steamId64 } = steamConnectionResult.data.profile;

    logger.info(
      { userId, steamId64, syncType: input.type },
      "Sending sync message to SQS"
    );

    try {
      const sqsClient = new SQSClient({
        region: env.AWS_REGION,
        endpoint: env.AWS_ENDPOINT_URL,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      });

      const message: SteamSyncMessage = {
        userId: userId!,
        steamId64,
        requestedAt: new Date().toISOString(),
        type: input.type,
      };

      const isFifoQueue = env.STEAM_SYNC_QUEUE_URL?.endsWith(".fifo");

      const command = new SendMessageCommand({
        QueueUrl: env.STEAM_SYNC_QUEUE_URL,
        MessageBody: JSON.stringify(message),
        ...(isFifoQueue && {
          MessageGroupId: userId,
          MessageDeduplicationId: `${userId}-${input.type}`,
        }),
      });

      await sqsClient.send(command);

      logger.info(
        { userId, steamId64, syncType: input.type },
        "Sync message sent to SQS successfully"
      );

      return {
        success: true,
        data: {
          message:
            "Steam library sync has been queued. This may take a few minutes.",
        },
      };
    } catch (error) {
      logger.error(
        { error, userId, steamId64 },
        "Failed to send sync message to SQS"
      );
      return {
        success: false,
        error: "Failed to queue sync. Please try again later.",
      };
    }
  },
});
