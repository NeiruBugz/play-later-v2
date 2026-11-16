import {
  SendMessageBatchCommand,
  SendMessageCommand,
  type SQSClient,
} from "@aws-sdk/client-sqs";

import { UpstreamError } from "@/shared/lib/errors";

import type { SyncQueue, SyncQueueName } from "./types";

const MAX_BATCH_ENTRIES = 10;

interface SqsSyncQueueOptions {
  client: Pick<SQSClient, "send">;
  queueUrls: { gather?: string; enrich?: string };
}

interface BatchEntry {
  Id: string;
  MessageBody: string;
}

export function createSqsSyncQueue({
  client,
  queueUrls,
}: SqsSyncQueueOptions): SyncQueue {
  function urlFor(queue: SyncQueueName): string {
    const url = queueUrls[queue];
    if (!url) {
      throw new UpstreamError(`No SQS URL configured for the ${queue} queue`);
    }
    return url;
  }

  async function sendEntries(
    queueUrl: string,
    entries: BatchEntry[]
  ): Promise<BatchEntry[]> {
    const result = await client.send(
      new SendMessageBatchCommand({ QueueUrl: queueUrl, Entries: entries })
    );
    const failedIds = new Set(
      (result.Failed ?? []).map((failure) => failure.Id)
    );
    return entries.filter((entry) => failedIds.has(entry.Id));
  }

  async function sendGroup(
    queueUrl: string,
    entries: BatchEntry[]
  ): Promise<void> {
    const stillFailing = await sendEntries(queueUrl, entries).then((failed) =>
      failed.length > 0 ? sendEntries(queueUrl, failed) : []
    );
    if (stillFailing.length > 0) {
      throw new UpstreamError("SQS rejected messages after one retry", {
        failedCount: stillFailing.length,
      });
    }
  }

  return {
    async send(queue, body) {
      await client.send(
        new SendMessageCommand({
          QueueUrl: urlFor(queue),
          MessageBody: JSON.stringify(body),
        })
      );
    },

    async sendBatch(queue, bodies) {
      if (bodies.length === 0) {
        return;
      }
      const queueUrl = urlFor(queue);
      const entries = bodies.map((body, index) => ({
        Id: String(index),
        MessageBody: JSON.stringify(body),
      }));
      for (let start = 0; start < entries.length; start += MAX_BATCH_ENTRIES) {
        await sendGroup(
          queueUrl,
          entries.slice(start, start + MAX_BATCH_ENTRIES)
        );
      }
    },
  };
}
