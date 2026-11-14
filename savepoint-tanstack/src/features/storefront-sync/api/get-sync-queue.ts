import { SQSClient } from "@aws-sdk/client-sqs";
import { env } from "@env";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

import type { SyncQueue } from "@/shared/api/queue";
import { createSqsSyncQueue } from "@/shared/api/queue/sqs";
import { createLogger } from "@/shared/lib";
import { UpstreamError } from "@/shared/lib/errors";

import { inlineSyncQueue } from "./inline-queue";

export type SyncQueueMode = "inline" | "sqs";

const logger = createLogger({ service: "storefront-sync-queue-config" });

let hasLoggedIncompleteSqsConfig = false;

function hasSqsConfig(): boolean {
  return Boolean(env.STEAM_SYNC_GATHER_QUEUE_URL && env.AWS_SYNC_ROLE_ARN);
}

export function resolveSyncQueueMode(): SyncQueueMode | null {
  if (env.STOREFRONT_SYNC_QUEUE === "sqs" && !hasSqsConfig()) {
    if (!hasLoggedIncompleteSqsConfig) {
      hasLoggedIncompleteSqsConfig = true;
      logger.warn(
        "STOREFRONT_SYNC_QUEUE=sqs needs STEAM_SYNC_GATHER_QUEUE_URL and AWS_SYNC_ROLE_ARN; sync is unavailable"
      );
    }
    return null;
  }
  if (env.STOREFRONT_SYNC_QUEUE) {
    return env.STOREFRONT_SYNC_QUEUE;
  }
  return env.NODE_ENV === "production" ? null : "inline";
}

function createWebSqsQueue(gatherUrl: string, roleArn: string): SyncQueue {
  const client = new SQSClient({
    region: env.AWS_REGION,
    credentials: awsCredentialsProvider({ roleArn }),
  });
  return createSqsSyncQueue({ client, queueUrls: { gather: gatherUrl } });
}

export function getSyncQueue(): SyncQueue {
  const mode = resolveSyncQueueMode();
  switch (mode) {
    case "inline":
      return inlineSyncQueue;
    case "sqs":
      return createWebSqsQueue(
        env.STEAM_SYNC_GATHER_QUEUE_URL as string,
        env.AWS_SYNC_ROLE_ARN as string
      );
    case null:
      throw new UpstreamError("Background sync is not configured");
  }
}
