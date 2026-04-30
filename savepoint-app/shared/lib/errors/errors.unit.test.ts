import { ConflictError } from "./conflict-error";
import { DomainError } from "./domain-error";
import { ExternalServiceError } from "./external-service-error";
import { NotFoundError } from "./not-found-error";
import { RateLimitError } from "./rate-limit-error";
import { UnauthorizedError } from "./unauthorized-error";

const subclasses = [
  { Class: NotFoundError, expectedName: "NotFoundError" },
  { Class: ConflictError, expectedName: "ConflictError" },
  { Class: UnauthorizedError, expectedName: "UnauthorizedError" },
  { Class: ExternalServiceError, expectedName: "ExternalServiceError" },
  { Class: RateLimitError, expectedName: "RateLimitError" },
] as const;

describe("DomainError base", () => {
  it("should preserve message", () => {
    class TestError extends DomainError {
      name = "TestError";
    }
    const error = new TestError("test message");
    expect(error.message).toBe("test message");
  });

  it("should be instanceof Error", () => {
    class TestError extends DomainError {
      name = "TestError";
    }
    expect(new TestError("msg")).toBeInstanceOf(Error);
  });

  it("should store context when provided", () => {
    class TestError extends DomainError {
      name = "TestError";
    }
    const context = { entityId: "123", operation: "find" };
    const error = new TestError("msg", context);
    expect(error.context).toEqual(context);
  });

  it("should have undefined context when not provided", () => {
    class TestError extends DomainError {
      name = "TestError";
    }
    expect(new TestError("msg").context).toBeUndefined();
  });

  it("should have a non-empty stack trace", () => {
    class TestError extends DomainError {
      name = "TestError";
    }
    const error = new TestError("msg");
    expect(error.stack).toBeTruthy();
    expect(typeof error.stack).toBe("string");
  });
});

describe.each(subclasses)("$expectedName", ({ Class, expectedName }) => {
  it("should be instanceof DomainError", () => {
    expect(new Class("msg")).toBeInstanceOf(DomainError);
  });

  it("should be instanceof Error", () => {
    expect(new Class("msg")).toBeInstanceOf(Error);
  });

  it("should preserve message", () => {
    expect(new Class("error message").message).toBe("error message");
  });

  it("should have correct name", () => {
    expect(new Class("msg").name).toBe(expectedName);
  });

  it("should store context when provided", () => {
    const context = { id: "abc", detail: 42 };
    expect(new Class("msg", context).context).toEqual(context);
  });

  it("should have undefined context when not provided", () => {
    expect(new Class("msg").context).toBeUndefined();
  });

  it("should have a non-empty stack trace that includes the throw site", () => {
    function throwIt(): never {
      throw new Class("msg");
    }

    let error: InstanceType<typeof Class> | undefined;
    try {
      throwIt();
    } catch (caught) {
      error = caught as InstanceType<typeof Class>;
    }

    expect(error?.stack).toBeTruthy();
    expect(error?.stack).toContain("throwIt");
  });
});

describe("RateLimitError", () => {
  it("should store retryAfter in context", () => {
    const error = new RateLimitError("rate limited", { retryAfter: 30 });
    expect(error.context).toEqual({ retryAfter: 30 });
  });
});
