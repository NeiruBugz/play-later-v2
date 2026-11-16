/**
 * RED unit tests for the enrich Lambda adapter (spec 030 tech 2.1, 2.4).
 *
 * Contract: `src/lambdas/steam-sync-enrich/handler.ts` exports
 *   handler(event: SQSEvent): Promise<SQSBatchResponse>
 * Per SQS record, in order:
 *   - JSON.parse the body and validate with `enrichMessageSchema`; invalid JSON
 *     or schema is a poison message: logged and acked (NOT in batchItemFailures,
 *     worker not called).
 *   - call `runEnrichMessage({ message, receiveCount })` where receiveCount is
 *     `Number(record.attributes.ApproximateReceiveCount)`. The final-attempt
 *     branch (receiveCount >= SYNC_MAX_RECEIVE_COUNT) lives in the worker, so
 *     the adapter must forward the count untouched.
 *   - a worker that throws puts `{ itemIdentifier: record.messageId }` into
 *     `batchItemFailures` (SQS retries it); other records are still processed.
 * SSM cold-start loading is NOT this module's concern (see load-ssm-env).
 * The event type is inferred from the handler so no `@types/aws-lambda` import
 * is needed in the test.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { runEnrichMessage } from "@/features/storefront-sync/api/enrich.worker";

import { handler } from "./handler";

vi.mock("@/features/storefront-sync/api/enrich.worker", () => ({
  runEnrichMessage: vi.fn(),
}));

vi.mock("@env", () => ({ env: {} }));

vi.mock("@/shared/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/lib")>();
  const stub = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  };
  stub.child = vi.fn(() => stub);
  return { ...actual, createLogger: vi.fn(() => stub) };
});

const runEnrichMessageMock = runEnrichMessage as ReturnType<typeof vi.fn>;

type EnrichEvent = Parameters<typeof handler>[0];

const sqsRecord = (options: {
  messageId: string;
  body: string;
  receiveCount?: string;
}) => ({
  messageId: options.messageId,
  receiptHandle: `receipt-${options.messageId}`,
  body: options.body,
  attributes: { ApproximateReceiveCount: options.receiveCount ?? "1" },
  messageAttributes: {},
  md5OfBody: "md5",
  eventSource: "aws:sqs",
  eventSourceARN: "arn:aws:sqs:eu-west-1:000000000000:enrich-q",
  awsRegion: "eu-west-1",
});

const eventOf = (...records: ReturnType<typeof sqsRecord>[]) =>
  ({ Records: records }) as unknown as EnrichEvent;

const enrichMessage = {
  v: 1,
  jobId: "job-1",
  chunkIndex: 2,
  importedGameIds: ["ig-1", "ig-2"],
  lookupCount: 2,
};

const enrichBody = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({ ...enrichMessage, ...overrides });

beforeEach(() => {
  vi.clearAllMocks();
  runEnrichMessageMock.mockResolvedValue(undefined);
});

describe("steam-sync-enrich handler", () => {
  describe("given a valid enrich message", () => {
    it("runs the enrich worker and reports no failures", async () => {
      const response = await handler(
        eventOf(sqsRecord({ messageId: "m-1", body: enrichBody() }))
      );

      expect(runEnrichMessageMock).toHaveBeenCalledTimes(1);
      expect(runEnrichMessageMock).toHaveBeenCalledWith({
        message: enrichMessage,
        receiveCount: 1,
      });
      expect(response).toEqual({ batchItemFailures: [] });
    });

    it("passes ApproximateReceiveCount to the worker as a number", async () => {
      await handler(
        eventOf(
          sqsRecord({
            messageId: "m-1",
            body: enrichBody(),
            receiveCount: "3",
          })
        )
      );

      expect(runEnrichMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({ receiveCount: 3 })
      );
    });

    it("tolerates fields from a newer producer", async () => {
      const response = await handler(
        eventOf(
          sqsRecord({
            messageId: "m-1",
            body: enrichBody({ futureField: "later" }),
          })
        )
      );

      expect(runEnrichMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({ chunkIndex: 2 }),
        })
      );
      expect(response).toEqual({ batchItemFailures: [] });
    });
  });

  describe("given the worker throws a retryable error", () => {
    it("reports the record in batchItemFailures so SQS retries it", async () => {
      runEnrichMessageMock.mockRejectedValueOnce(new Error("igdb 429"));

      const response = await handler(
        eventOf(sqsRecord({ messageId: "m-1", body: enrichBody() }))
      );

      expect(response).toEqual({
        batchItemFailures: [{ itemIdentifier: "m-1" }],
      });
    });
  });

  describe("given a poison message", () => {
    it.each([
      ["a body that is not JSON", "not-json{"],
      ["an unknown message version", enrichBody({ v: 2 })],
      ["a negative chunk index", enrichBody({ chunkIndex: -1 })],
      [
        "more than 200 imported game ids",
        enrichBody({
          importedGameIds: Array.from({ length: 201 }, (_, i) => `ig-${i}`),
        }),
      ],
      [
        "a missing job id",
        JSON.stringify({ ...enrichMessage, jobId: undefined }),
      ],
    ])("acks %s without running the worker", async (_label, body) => {
      const response = await handler(
        eventOf(sqsRecord({ messageId: "m-1", body }))
      );

      expect(runEnrichMessageMock).not.toHaveBeenCalled();
      expect(response).toEqual({ batchItemFailures: [] });
    });
  });

  describe("given a batch with a poison message, a failing record and a good record", () => {
    it("fails only the retryable record and still processes the rest", async () => {
      runEnrichMessageMock.mockImplementation(
        async ({ message }: { message: { jobId: string } }) => {
          if (message.jobId === "job-fails") {
            throw new Error("igdb timeout");
          }
        }
      );

      const response = await handler(
        eventOf(
          sqsRecord({ messageId: "m-poison", body: "not-json{" }),
          sqsRecord({
            messageId: "m-fails",
            body: enrichBody({ jobId: "job-fails" }),
          }),
          sqsRecord({
            messageId: "m-ok",
            body: enrichBody({ jobId: "job-ok" }),
          })
        )
      );

      expect(runEnrichMessageMock).toHaveBeenCalledTimes(2);
      expect(runEnrichMessageMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({ jobId: "job-ok" }),
        })
      );
      expect(response).toEqual({
        batchItemFailures: [{ itemIdentifier: "m-fails" }],
      });
    });
  });
});
