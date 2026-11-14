import { SQSClient } from "@aws-sdk/client-sqs";
import { env } from "@env";

import { createSqsSyncQueue } from "@/shared/api/queue/sqs";

export function createEnrichQueue() {
  return createSqsSyncQueue({
    client: new SQSClient({}),
    queueUrls: { enrich: env.STEAM_SYNC_ENRICH_QUEUE_URL },
  });
}
