import type { SQSBatchResponse, SQSEvent } from "aws-lambda";
import type { ZodType } from "zod";

import { createLogger } from "@/shared/lib";

export async function processSqsBatch<
  TMessage extends { jobId: string },
>(args: {
  event: SQSEvent;
  service: string;
  schema: ZodType<TMessage>;
  run: (input: { message: TMessage; receiveCount: number }) => Promise<void>;
}): Promise<SQSBatchResponse> {
  const { event, service, schema, run } = args;
  const logger = createLogger({ service });
  const batchItemFailures: SQSBatchResponse["batchItemFailures"] = [];

  for (const record of event.Records) {
    const receiveCount = Number(record.attributes.ApproximateReceiveCount);
    const parsed = parseBody(schema, record.body);
    if (!parsed.success) {
      logger
        .child({ messageId: record.messageId, receiveCount })
        .error("Dropping poison message");
      continue;
    }
    const log = logger.child({
      jobId: parsed.data.jobId,
      messageId: record.messageId,
      receiveCount,
    });
    try {
      await run({ message: parsed.data, receiveCount });
    } catch (error) {
      log.error({ err: error }, "Message failed, leaving it for SQS retry");
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }
  return { batchItemFailures };
}

function parseBody<TMessage>(schema: ZodType<TMessage>, body: string) {
  try {
    return schema.safeParse(JSON.parse(body));
  } catch {
    return { success: false as const };
  }
}
