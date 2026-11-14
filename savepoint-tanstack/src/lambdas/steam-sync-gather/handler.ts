import type { SQSBatchResponse, SQSEvent } from "aws-lambda";

import { runGatherMessage } from "@/features/storefront-sync/api/gather.worker";
import { gatherMessageSchema } from "@/features/storefront-sync/model/messages";

import { createEnrichQueue } from "../shared/enrich-queue";
import { processSqsBatch } from "../shared/sqs-batch";

let queue: ReturnType<typeof createEnrichQueue> | undefined;

export const handler = (event: SQSEvent): Promise<SQSBatchResponse> =>
  processSqsBatch({
    event,
    service: "steam-sync-gather",
    schema: gatherMessageSchema,
    run: (input) => {
      queue ??= createEnrichQueue();
      return runGatherMessage({ ...input, queue });
    },
  });
