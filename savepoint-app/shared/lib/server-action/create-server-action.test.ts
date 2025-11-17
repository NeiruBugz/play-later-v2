import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { z } from "zod";

import { createServerAction } from "./create-server-action";

vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

vi.mock("@/shared/lib/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
  LOGGER_CONTEXT: {
    SERVER_ACTION: "serverAction",
  },
}));

const { getServerUserId } = await import("@/auth");
const mockGetServerUserId = getServerUserId as Mock;

const TestSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
});

type TestInput = z.infer<typeof TestSchema>;

describe("createServerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate input with Zod schema and return error on invalid data", async () => {
    const handler = vi.fn();
    const action = createServerAction({
      actionName: "testAction",
      schema: TestSchema,
      requireAuth: false,
      handler,
    });

    const result = await action({ id: -1, name: "" } as TestInput);

    expect(result).toEqual({
      success: false,
      error: "Invalid input data",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("should require authentication when requireAuth is true", async () => {
    mockGetServerUserId.mockResolvedValue(undefined);

    const handler = vi.fn();
    const action = createServerAction({
      actionName: "testAction",
      schema: TestSchema,
      requireAuth: true,
      handler,
    });

    const result = await action({ id: 1, name: "test" });

    expect(result).toEqual({
      success: false,
      error: "You must be logged in to perform this action",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("should skip authentication when requireAuth is false", async () => {
    const handler = vi.fn().mockResolvedValue({
      success: true,
      data: { message: "Success" },
    });

    const action = createServerAction({
      actionName: "testAction",
      schema: TestSchema,
      requireAuth: false,
      handler,
    });

    const result = await action({ id: 1, name: "test" });

    expect(mockGetServerUserId).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith({
      input: { id: 1, name: "test" },
      userId: undefined,
      logger: expect.any(Object),
    });
    expect(result).toEqual({
      success: true,
      data: { message: "Success" },
    });
  });

  it("should pass validated input and userId to handler when authenticated", async () => {
    mockGetServerUserId.mockResolvedValue("user-123");

    const handler = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 1 },
    });

    const action = createServerAction({
      actionName: "testAction",
      schema: TestSchema,
      requireAuth: true,
      handler,
    });

    const result = await action({ id: 1, name: "test" });

    expect(handler).toHaveBeenCalledWith({
      input: { id: 1, name: "test" },
      userId: "user-123",
      logger: expect.any(Object),
    });
    expect(result).toEqual({
      success: true,
      data: { id: 1 },
    });
  });

  it("should pass logger to handler", async () => {
    const handler = vi.fn().mockResolvedValue({
      success: true,
      data: {},
    });

    const action = createServerAction({
      actionName: "testAction",
      schema: TestSchema,
      requireAuth: false,
      handler,
    });

    await action({ id: 1, name: "test" });

    const handlerCall = handler.mock.calls[0]?.[0];
    expect(handlerCall?.logger).toBeDefined();
    expect(handlerCall?.logger.info).toBeDefined();
    expect(handlerCall?.logger.warn).toBeDefined();
    expect(handlerCall?.logger.error).toBeDefined();
  });

  it("should catch unexpected errors and return error result", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("Database error"));

    const action = createServerAction({
      actionName: "testAction",
      schema: TestSchema,
      requireAuth: false,
      handler,
    });

    const result = await action({ id: 1, name: "test" });

    expect(result).toEqual({
      success: false,
      error: "Database error",
    });
  });

  it("should handle non-Error exceptions", async () => {
    const handler = vi.fn().mockRejectedValue("String error");

    const action = createServerAction({
      actionName: "testAction",
      schema: TestSchema,
      requireAuth: false,
      handler,
    });

    const result = await action({ id: 1, name: "test" });

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred",
    });
  });

  it("should return handler result on success", async () => {
    const handler = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 1, title: "Test Game" },
    });

    const action = createServerAction({
      actionName: "testAction",
      schema: TestSchema,
      requireAuth: false,
      handler,
    });

    const result = await action({ id: 1, name: "test" });

    expect(result).toEqual({
      success: true,
      data: { id: 1, title: "Test Game" },
    });
  });

  it("should return handler error result on failure", async () => {
    const handler = vi.fn().mockResolvedValue({
      success: false,
      error: "Service failed to process request",
    });

    const action = createServerAction({
      actionName: "testAction",
      schema: TestSchema,
      requireAuth: false,
      handler,
    });

    const result = await action({ id: 1, name: "test" });

    expect(result).toEqual({
      success: false,
      error: "Service failed to process request",
    });
  });

  it("should default requireAuth to true", async () => {
    mockGetServerUserId.mockResolvedValue(undefined);

    const handler = vi.fn();
    const action = createServerAction({
      actionName: "testAction",
      schema: TestSchema,
      handler,
    });

    const result = await action({ id: 1, name: "test" });

    expect(mockGetServerUserId).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "You must be logged in to perform this action",
    });
  });
});
