import { describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import {
  ConflictError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
} from "@/shared/lib/errors";

import { mapErrorToHandlerResult } from "./map-error";

vi.mock("@/shared/lib", () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  })),
  LOGGER_CONTEXT: {
    HANDLER: "handler",
  },
}));

describe("mapErrorToHandlerResult", () => {
  describe("status mapping", () => {
    it("maps ZodError to 400", () => {
      const error = new ZodError([]);
      const result = mapErrorToHandlerResult(error);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.status).toBe(400);
    });

    it("maps NotFoundError to 404", () => {
      const error = new NotFoundError("not found");
      const result = mapErrorToHandlerResult(error);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.status).toBe(404);
    });

    it("maps UnauthorizedError to 401", () => {
      const error = new UnauthorizedError("unauthorized");
      const result = mapErrorToHandlerResult(error);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.status).toBe(401);
    });

    it("maps ConflictError to 409", () => {
      const error = new ConflictError("conflict");
      const result = mapErrorToHandlerResult(error);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.status).toBe(409);
    });

    it("maps RateLimitError to 429", () => {
      const error = new RateLimitError("rate limited");
      const result = mapErrorToHandlerResult(error);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.status).toBe(429);
    });

    it("maps unknown Error to 500", () => {
      const error = new Error("something exploded");
      const result = mapErrorToHandlerResult(error);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.status).toBe(500);
    });

    it("maps non-Error unknown to 500", () => {
      const result = mapErrorToHandlerResult("string error");
      expect(result.success).toBe(false);
      if (!result.success) expect(result.status).toBe(500);
    });
  });

  describe("message extraction", () => {
    it("uses error.message for Error instances", () => {
      const error = new NotFoundError("platform not found");
      const result = mapErrorToHandlerResult(error);
      if (!result.success) expect(result.error).toBe("platform not found");
    });

    it("uses fallback message for non-Error values", () => {
      const result = mapErrorToHandlerResult(42);
      if (!result.success)
        expect(result.error).toBe("An unexpected error occurred");
    });
  });

  describe("result shape", () => {
    it("always returns success: false", () => {
      expect(mapErrorToHandlerResult(new NotFoundError("x")).success).toBe(
        false
      );
      expect(mapErrorToHandlerResult(new Error("y")).success).toBe(false);
    });

    it("returns HandlerResult with status and error fields", () => {
      const result = mapErrorToHandlerResult(new ConflictError("dupe"));
      expect(result).toMatchObject({
        success: false,
        status: 409,
        error: "dupe",
      });
    });
  });
});
