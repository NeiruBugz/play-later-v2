import { beforeEach, describe, expect, it } from "vitest";

import {
  AppError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  UpstreamError,
  ValidationError,
} from "@/shared/lib/errors";

describe("AppError taxonomy", () => {
  describe("given a NotFoundError", () => {
    let error: NotFoundError;

    beforeEach(() => {
      error = new NotFoundError("resource not found", { resourceId: "abc" });
    });

    it("preserves the NOT_FOUND code", () => {
      expect(error.code).toBe("NOT_FOUND");
    });

    it("is an instance of AppError and Error", () => {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error).toBeInstanceOf(Error);
    });

    it("serializes via toJSON with the code field", () => {
      expect(error.toJSON()).toMatchObject({
        name: "NotFoundError",
        code: "NOT_FOUND",
        message: "resource not found",
      });
    });

    it("preserves the message", () => {
      expect(error.message).toBe("resource not found");
    });

    it("stores the context when provided", () => {
      expect(error.context).toEqual({ resourceId: "abc" });
    });

    it("has undefined context when not provided", () => {
      const bare = new NotFoundError("not found");
      expect(bare.context).toBeUndefined();
    });
  });

  describe("given a ConflictError", () => {
    let error: ConflictError;

    beforeEach(() => {
      error = new ConflictError("username already taken", { username: "nail" });
    });

    it("preserves the CONFLICT code", () => {
      expect(error.code).toBe("CONFLICT");
    });

    it("is an instance of AppError and Error", () => {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error).toBeInstanceOf(Error);
    });

    it("serializes via toJSON with the code field", () => {
      expect(error.toJSON()).toMatchObject({
        name: "ConflictError",
        code: "CONFLICT",
        message: "username already taken",
      });
    });

    it("preserves the message", () => {
      expect(error.message).toBe("username already taken");
    });

    it("stores the context when provided", () => {
      expect(error.context).toEqual({ username: "nail" });
    });

    it("has undefined context when not provided", () => {
      const bare = new ConflictError("conflict");
      expect(bare.context).toBeUndefined();
    });
  });

  describe("given a ValidationError", () => {
    let error: ValidationError;

    beforeEach(() => {
      error = new ValidationError("input is invalid", { field: "email" });
    });

    it("preserves the VALIDATION code", () => {
      expect(error.code).toBe("VALIDATION");
    });

    it("is an instance of AppError and Error", () => {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(Error);
    });

    it("serializes via toJSON with the code field", () => {
      expect(error.toJSON()).toMatchObject({
        name: "ValidationError",
        code: "VALIDATION",
        message: "input is invalid",
      });
    });

    it("preserves the message", () => {
      expect(error.message).toBe("input is invalid");
    });

    it("stores the context when provided", () => {
      expect(error.context).toEqual({ field: "email" });
    });

    it("has undefined context when not provided", () => {
      const bare = new ValidationError("invalid");
      expect(bare.context).toBeUndefined();
    });
  });

  describe("given an UnauthorizedError", () => {
    let error: UnauthorizedError;

    beforeEach(() => {
      error = new UnauthorizedError("access denied", { userId: "u_123" });
    });

    it("preserves the UNAUTHORIZED code", () => {
      expect(error.code).toBe("UNAUTHORIZED");
    });

    it("is an instance of AppError and Error", () => {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error).toBeInstanceOf(Error);
    });

    it("serializes via toJSON with the code field", () => {
      expect(error.toJSON()).toMatchObject({
        name: "UnauthorizedError",
        code: "UNAUTHORIZED",
        message: "access denied",
      });
    });

    it("preserves the message", () => {
      expect(error.message).toBe("access denied");
    });

    it("stores the context when provided", () => {
      expect(error.context).toEqual({ userId: "u_123" });
    });

    it("has undefined context when not provided", () => {
      const bare = new UnauthorizedError("unauthorized");
      expect(bare.context).toBeUndefined();
    });
  });

  describe("given an UpstreamError", () => {
    let error: UpstreamError;

    beforeEach(() => {
      error = new UpstreamError("IGDB request failed", { statusCode: 503 });
    });

    it("preserves the UPSTREAM code", () => {
      expect(error.code).toBe("UPSTREAM");
    });

    it("is an instance of AppError and Error", () => {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(UpstreamError);
      expect(error).toBeInstanceOf(Error);
    });

    it("serializes via toJSON with the code field", () => {
      expect(error.toJSON()).toMatchObject({
        name: "UpstreamError",
        code: "UPSTREAM",
        message: "IGDB request failed",
      });
    });

    it("preserves the message", () => {
      expect(error.message).toBe("IGDB request failed");
    });

    it("stores the context when provided", () => {
      expect(error.context).toEqual({ statusCode: 503 });
    });

    it("has undefined context when not provided", () => {
      const bare = new UpstreamError("upstream failure");
      expect(bare.context).toBeUndefined();
    });
  });
});
