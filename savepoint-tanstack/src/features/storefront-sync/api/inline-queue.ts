import type { SyncQueue, SyncQueueName } from "@/shared/api/queue";
import { createLogger } from "@/shared/lib";

import { enrichMessageSchema, gatherMessageSchema } from "../model/messages";

const logger = createLogger({ service: "storefront-sync-inline-queue" });

const INLINE_RECEIVE_COUNT = 1;

const inFlightDeliveries = new Set<Promise<void>>();

async function deliver(queue: SyncQueueName, body: unknown): Promise<void> {
  if (queue === "enrich") {
    const { runEnrichMessage } = await import("./enrich.worker");
    const parsed = enrichMessageSchema.safeParse(body);
    if (!parsed.success) {
      logger.error({ queue }, "Dropping invalid inline queue message");
      return;
    }
    await runEnrichMessage({
      message: parsed.data,
      receiveCount: INLINE_RECEIVE_COUNT,
    });
    return;
  }

  const { runGatherMessage } = await import("./gather.worker");
  const parsed = gatherMessageSchema.safeParse(body);
  if (!parsed.success) {
    logger.error({ queue }, "Dropping invalid inline queue message");
    return;
  }
  await runGatherMessage({
    message: parsed.data,
    receiveCount: INLINE_RECEIVE_COUNT,
  });
}

export const inlineSyncQueue: SyncQueue = {
  async send(queue, body) {
    const delivery = new Promise<void>((resolve) => {
      setImmediate(() => {
        deliver(queue, body)
          .catch((error: unknown) => {
            logger.error({ queue, error }, "Inline queue delivery failed");
          })
          .finally(() => {
            inFlightDeliveries.delete(delivery);
            resolve();
          });
      });
    });
    inFlightDeliveries.add(delivery);
  },
};

export async function drainInlineSyncQueue(): Promise<void> {
  while (inFlightDeliveries.size > 0) {
    await Promise.all([...inFlightDeliveries]);
  }
}
