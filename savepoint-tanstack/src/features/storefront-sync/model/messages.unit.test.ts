/**
 * RED unit tests for the queue message contracts (spec 030 tech 2.4).
 *
 * Contract: `features/storefront-sync/model/messages.ts` exports
 *   gatherMessageSchema  { v: 1, jobId: string }
 *   enrichMessageSchema  { v: 1, jobId, chunkIndex: int >= 0, importedGameIds: string[] (<= 200), lookupCount: int >= 0 }
 * Unknown fields are tolerated; anything else invalid is a poison message.
 */
import { describe, expect, it } from "vitest";

import { enrichMessageSchema, gatherMessageSchema } from "./messages";

const validEnrich = {
  v: 1,
  jobId: "job-1",
  chunkIndex: 0,
  importedGameIds: ["ig-1", "ig-2"],
  lookupCount: 2,
};

const idsOfLength = (length: number) =>
  Array.from({ length }, (_, index) => `ig-${index}`);

describe("gatherMessageSchema", () => {
  describe("given a v1 message with a job id", () => {
    it("is accepted", () => {
      expect(
        gatherMessageSchema.safeParse({ v: 1, jobId: "job-1" }).success
      ).toBe(true);
    });
  });

  describe("given a v1 message carrying a field from a newer producer", () => {
    it("is accepted", () => {
      expect(
        gatherMessageSchema.safeParse({ v: 1, jobId: "job-1", futureField: 7 })
          .success
      ).toBe(true);
    });
  });

  describe("given a poison message", () => {
    it.each([
      ["an unknown version", { v: 2, jobId: "job-1" }],
      ["a missing version", { jobId: "job-1" }],
      ["a missing job id", { v: 1 }],
      ["an empty job id", { v: 1, jobId: "" }],
      ["a non-object body", "not-json-object"],
    ])("rejects %s", (_label, body) => {
      expect(gatherMessageSchema.safeParse(body).success).toBe(false);
    });
  });
});

describe("enrichMessageSchema", () => {
  describe("given a complete v1 chunk message", () => {
    it("is accepted", () => {
      expect(enrichMessageSchema.safeParse(validEnrich).success).toBe(true);
    });
  });

  describe("given a chunk message carrying a field from a newer producer", () => {
    it("is accepted", () => {
      expect(
        enrichMessageSchema.safeParse({ ...validEnrich, futureField: "x" })
          .success
      ).toBe(true);
    });
  });

  describe("given a chunk of exactly 200 ids", () => {
    it("is accepted", () => {
      expect(
        enrichMessageSchema.safeParse({
          ...validEnrich,
          importedGameIds: idsOfLength(200),
          lookupCount: 200,
        }).success
      ).toBe(true);
    });
  });

  describe("given a poison message", () => {
    it.each([
      ["an unknown version", { ...validEnrich, v: 2 }],
      ["a missing job id", { ...validEnrich, jobId: undefined }],
      ["a negative chunk index", { ...validEnrich, chunkIndex: -1 }],
      ["a fractional chunk index", { ...validEnrich, chunkIndex: 0.5 }],
      ["a negative lookup count", { ...validEnrich, lookupCount: -1 }],
      [
        "ids that are not an array",
        { ...validEnrich, importedGameIds: "ig-1" },
      ],
      [
        "more than 200 ids",
        { ...validEnrich, importedGameIds: idsOfLength(201) },
      ],
    ])("rejects %s", (_label, body) => {
      expect(enrichMessageSchema.safeParse(body).success).toBe(false);
    });
  });
});
