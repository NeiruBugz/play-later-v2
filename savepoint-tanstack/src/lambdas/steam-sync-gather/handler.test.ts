/**
 * RED unit tests for the gather Lambda adapter (spec 030 tech 2.1, 2.4).
 *
 * Contract: `src/lambdas/steam-sync-gather/handler.ts` exports
 *   handler(event: SQSEvent): Promise<SQSBatchResponse>
 * Per SQS record, in order:
 *   - JSON.parse the body and validate with `gatherMessageSchema`; invalid JSON
 *     or schema is a poison message: logged and acked (NOT in batchItemFailures,
 *     worker not called).
 *   - call `runGatherMessage({ message, receiveCount })` where receiveCount is
 *     `Number(record.attributes.ApproximateReceiveCount)`.
 *   - a worker that throws puts `{ itemIdentifier: record.messageId }` into
 *     `batchItemFailures` (SQS retries it); other records are still processed.
 * SSM cold-start loading is NOT this module's concern (see load-ssm-env).
 * The event type is inferred from the handler so no `@types/aws-lambda` import
 * is needed in the test.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { runGatherMessage } from "@/features/storefront-sync/api/gather.worker";

import { handler } from "./handler";

vi.mock("@/features/storefront-sync/api/gather.worker", () => ({
  runGatherMessage: vi.fn(),
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

const runGatherMessageMock = runGatherMessage as ReturnType<typeof vi.fn>;

type GatherEvent = Parameters<typeof handler>[0];

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
  eventSourceARN: "arn:aws:sqs:eu-west-1:000000000000:gather-q",
  awsRegion: "eu-west-1",
});

const eventOf = (...records: ReturnType<typeof sqsRecord>[]) =>
  ({ Records: records }) as unknown as GatherEvent;

const gatherBody = (jobId: string) => JSON.stringify({ v: 1, jobId });

beforeEach(() => {
  vi.clearAllMocks();
  runGatherMessageMock.mockResolvedValue(undefined);
});

describe("steam-sync-gather handler", () => {
  describe("given a valid gather message", () => {
    it("runs the gather worker and reports no failures", async () => {
      const response = await handler(
        eventOf(sqsRecord({ messageId: "m-1", body: gatherBody("job-1") }))
      );

      expect(runGatherMessageMock).toHaveBeenCalledTimes(1);
      expect(runGatherMessageMock).toHaveBeenCalledWith({
        message: { v: 1, jobId: "job-1" },
        receiveCount: 1,
      });
      expect(response).toEqual({ batchItemFailures: [] });
    });

    it("passes ApproximateReceiveCount to the worker as a number", async () => {
      await handler(
        eventOf(
          sqsRecord({
            messageId: "m-1",
            body: gatherBody("job-1"),
            receiveCount: "3",
          })
        )
      );

      expect(runGatherMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({ receiveCount: 3 })
      );
    });

    it("tolerates fields from a newer producer", async () => {
      const response = await handler(
        eventOf(
          sqsRecord({
            messageId: "m-1",
            body: JSON.stringify({ v: 1, jobId: "job-1", futureField: 7 }),
          })
        )
      );

      expect(runGatherMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({ jobId: "job-1" }),
        })
      );
      expect(response).toEqual({ batchItemFailures: [] });
    });
  });

  describe("given the worker throws a retryable error", () => {
    it("reports the record in batchItemFailures so SQS retries it", async () => {
      runGatherMessageMock.mockRejectedValueOnce(new Error("db unavailable"));

      const response = await handler(
        eventOf(sqsRecord({ messageId: "m-1", body: gatherBody("job-1") }))
      );

      expect(response).toEqual({
        batchItemFailures: [{ itemIdentifier: "m-1" }],
      });
    });
  });

  describe("given a poison message", () => {
    it.each([
      ["a body that is not JSON", "not-json{"],
      ["an unknown message version", JSON.stringify({ v: 2, jobId: "job-1" })],
      ["a missing job id", JSON.stringify({ v: 1 })],
      ["an empty job id", JSON.stringify({ v: 1, jobId: "" })],
    ])("acks %s without running the worker", async (_label, body) => {
      const response = await handler(
        eventOf(sqsRecord({ messageId: "m-1", body }))
      );

      expect(runGatherMessageMock).not.toHaveBeenCalled();
      expect(response).toEqual({ batchItemFailures: [] });
    });
  });

  describe("given a batch with a poison message, a failing record and a good record", () => {
    it("fails only the retryable record and still processes the rest", async () => {
      runGatherMessageMock.mockImplementation(
        async ({ message }: { message: { jobId: string } }) => {
          if (message.jobId === "job-fails") {
            throw new Error("steam unavailable");
          }
        }
      );

      const response = await handler(
        eventOf(
          sqsRecord({ messageId: "m-poison", body: "not-json{" }),
          sqsRecord({ messageId: "m-fails", body: gatherBody("job-fails") }),
          sqsRecord({ messageId: "m-ok", body: gatherBody("job-ok") })
        )
      );

      expect(runGatherMessageMock).toHaveBeenCalledTimes(2);
      expect(runGatherMessageMock).toHaveBeenLastCalledWith(
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
