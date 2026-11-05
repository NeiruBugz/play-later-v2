// @vitest-environment node
import { describe, expect, it } from "vitest";

import { sendErrorThroughServerFn as callServerFnThatThrows } from "../../../test/support/server-fn-error-transport";
import { ConflictError, NotFoundError } from "./errors";
import { getUserFacingErrorMessage } from "./user-facing-error";

describe("AppError over the real server-fn handler and client fetcher", () => {
  it("delivers ConflictError code and context.code to the client", async () => {
    const received = (await callServerFnThatThrows(
      new ConflictError("Up Next is full", { code: "UP_NEXT_FULL" })
    )) as ConflictError;

    expect(received).toBeInstanceOf(ConflictError);
    expect(received.message).toBe("Up Next is full");
    expect(received.code).toBe("CONFLICT");
    expect(received.context).toEqual({ code: "UP_NEXT_FULL" });
    expect(getUserFacingErrorMessage(received)).toBe(
      "Up Next holds 5 games. Remove one to add this."
    );
  });

  it("delivers NotFoundError with code NOT_FOUND and keeps server-side context off the client", async () => {
    const received = (await callServerFnThatThrows(
      new NotFoundError("Library item not found", { userId: "u1", itemId: 5 })
    )) as NotFoundError;

    expect(received).toBeInstanceOf(NotFoundError);
    expect(received.code).toBe("NOT_FOUND");
    expect(received.context).toBeUndefined();
    expect(JSON.stringify(received)).not.toContain("u1");
  });

  it("still delivers plain errors as errors with their message", async () => {
    const received = (await callServerFnThatThrows(new Error("boom"))) as Error;

    expect(received).toBeInstanceOf(Error);
    expect(received.message).toBe("boom");
  });
});
