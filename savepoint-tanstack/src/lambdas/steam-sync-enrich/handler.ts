import type { SQSBatchResponse, SQSEvent } from "aws-lambda";

import { runEnrichMessage } from "@/features/storefront-sync/api/enrich.worker";
import { enrichMessageSchema } from "@/features/storefront-sync/model/messages";

import { processSqsBatch } from "../shared/sqs-batch";

export const handler = (event: SQSEvent): Promise<SQSBatchResponse> =>
  processSqsBatch({
    event,
    service: "steam-sync-enrich",
    schema: enrichMessageSchema,
    run: runEnrichMessage,
  });
