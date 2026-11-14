/**
 * RED unit tests for the SQS transport of the SyncQueue port (spec 030 tech 2.4, 2.8).
 *
 * Contract: `shared/api/queue/sqs.ts` exports
 *   createSqsSyncQueue({ client, queueUrls: { gather: string; enrich?: string } })
 * returning the SyncQueue port extended with
 *   sendBatch(queue: SyncQueueName, bodies: unknown[]): Promise<void>
 *   - send(queue, body): one SendMessageCommand, QueueUrl of that queue,
 *     MessageBody = JSON.stringify(body). A queue without a configured URL
 *     (the web app has only `gather`) rejects.
 *   - sendBatch: SendMessageBatchCommand in groups of at most 10 entries, each
 *     entry with a unique Id and MessageBody = JSON.stringify(body), original
 *     order preserved. No bodies, no calls. Entries reported in `Failed[]` are
 *     re-sent once (only those entries); still failing after that throws
 *     UpstreamError.
 * The client is faked (`send` only); commands are inspected through `.input`.
 * The web-side OIDC credential wiring is not unit-tested here.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UpstreamError } from "@/shared/lib/errors";

import { createSqsSyncQueue } from "./sqs";

const GATHER_URL = "https://sqs.eu-west-1.amazonaws.com/000000000000/gather-q";
const ENRICH_URL = "https://sqs.eu-west-1.amazonaws.com/000000000000/enrich-q";

interface SentCommand {
  constructor: { name: string };
  input: {
    QueueUrl: string;
    MessageBody?: string;
    Entries?: { Id: string; MessageBody: string }[];
  };
}

const sendMock = vi.fn();

type SqsClient = Parameters<typeof createSqsSyncQueue>[0]["client"];

const buildQueue = (queueUrls: { gather: string; enrich?: string }) =>
  createSqsSyncQueue({
    client: { send: sendMock } as unknown as SqsClient,
    queueUrls,
  });

const sentCommands = () =>
  sendMock.mock.calls.map(([command]) => command as SentCommand);

const bodiesOf = (command: SentCommand) =>
  (command.input.Entries ?? []).map((entry) => JSON.parse(entry.MessageBody));

const numberedBodies = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ v: 1, chunkIndex: index }));

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({ Successful: [], Failed: [] });
});

describe("createSqsSyncQueue", () => {
  describe("send", () => {
    it("sends the JSON body to the gather queue", async () => {
      const queue = buildQueue({ gather: GATHER_URL, enrich: ENRICH_URL });

      await queue.send("gather", { v: 1, jobId: "job-1" });

      const [command] = sentCommands();
      expect(sentCommands()).toHaveLength(1);
      expect(command.constructor.name).toBe("SendMessageCommand");
      expect(command.input.QueueUrl).toBe(GATHER_URL);
      expect(JSON.parse(command.input.MessageBody ?? "")).toEqual({
        v: 1,
        jobId: "job-1",
      });
    });

    it("sends to the enrich queue when it is configured", async () => {
      const queue = buildQueue({ gather: GATHER_URL, enrich: ENRICH_URL });

      await queue.send("enrich", { v: 1, jobId: "job-1", chunkIndex: 0 });

      expect(sentCommands()[0].input.QueueUrl).toBe(ENRICH_URL);
    });

    it("rejects sending to a queue that has no URL configured", async () => {
      const queue = buildQueue({ gather: GATHER_URL });

      await expect(queue.send("enrich", { v: 1 })).rejects.toThrow();
      expect(sendMock).not.toHaveBeenCalled();
    });

    it("rejects when SQS rejects the message", async () => {
      sendMock.mockRejectedValueOnce(new Error("AccessDenied"));
      const queue = buildQueue({ gather: GATHER_URL });

      await expect(queue.send("gather", { v: 1 })).rejects.toThrow();
    });
  });

  describe("sendBatch", () => {
    describe("given 25 messages", () => {
      it("sends three batches of 10, 10 and 5 in the original order", async () => {
        const queue = buildQueue({ gather: GATHER_URL, enrich: ENRICH_URL });
        const bodies = numberedBodies(25);

        await queue.sendBatch("enrich", bodies);

        const commands = sentCommands();
        expect(commands.map((command) => command.constructor.name)).toEqual([
          "SendMessageBatchCommand",
          "SendMessageBatchCommand",
          "SendMessageBatchCommand",
        ]);
        expect(
          commands.map((command) => command.input.Entries?.length)
        ).toEqual([10, 10, 5]);
        expect(commands.every((c) => c.input.QueueUrl === ENRICH_URL)).toBe(
          true
        );
        expect(commands.flatMap(bodiesOf)).toEqual(bodies);
      });

      it("gives every entry in a batch a distinct Id", async () => {
        const queue = buildQueue({ gather: GATHER_URL, enrich: ENRICH_URL });

        await queue.sendBatch("enrich", numberedBodies(10));

        const ids = (sentCommands()[0].input.Entries ?? []).map((e) => e.Id);
        expect(new Set(ids).size).toBe(10);
      });
    });

    describe("given exactly 10 messages", () => {
      it("sends a single batch", async () => {
        const queue = buildQueue({ gather: GATHER_URL, enrich: ENRICH_URL });

        await queue.sendBatch("enrich", numberedBodies(10));

        expect(sentCommands()).toHaveLength(1);
      });
    });

    describe("given no messages", () => {
      it("does not call SQS", async () => {
        const queue = buildQueue({ gather: GATHER_URL, enrich: ENRICH_URL });

        await queue.sendBatch("enrich", []);

        expect(sendMock).not.toHaveBeenCalled();
      });
    });

    describe("given a queue that has no URL configured", () => {
      it("rejects without calling SQS", async () => {
        const queue = buildQueue({ gather: GATHER_URL });

        await expect(
          queue.sendBatch("enrich", numberedBodies(2))
        ).rejects.toThrow();
        expect(sendMock).not.toHaveBeenCalled();
      });
    });

    describe("given SQS reports one entry as failed", () => {
      it("re-sends only the failed entry and resolves when the retry succeeds", async () => {
        const queue = buildQueue({ gather: GATHER_URL, enrich: ENRICH_URL });
        const bodies = numberedBodies(3);
        sendMock.mockImplementationOnce(async (command: SentCommand) => {
          const failedEntry = command.input.Entries?.[1];
          return {
            Successful: [],
            Failed: [
              {
                Id: failedEntry?.Id,
                Code: "InternalError",
                SenderFault: false,
              },
            ],
          };
        });

        await queue.sendBatch("enrich", bodies);

        const commands = sentCommands();
        expect(commands).toHaveLength(2);
        expect(bodiesOf(commands[1])).toEqual([bodies[1]]);
        expect(commands[1].input.QueueUrl).toBe(ENRICH_URL);
      });
    });

    describe("given SQS keeps failing the same entry", () => {
      it("retries once and then throws an UpstreamError", async () => {
        const queue = buildQueue({ gather: GATHER_URL, enrich: ENRICH_URL });
        sendMock.mockImplementation(async (command: SentCommand) => ({
          Successful: [],
          Failed: [
            {
              Id: command.input.Entries?.[0].Id,
              Code: "InternalError",
              SenderFault: false,
            },
          ],
        }));

        await expect(
          queue.sendBatch("enrich", numberedBodies(2))
        ).rejects.toBeInstanceOf(UpstreamError);
        expect(sentCommands()).toHaveLength(2);
      });
    });
  });
});
