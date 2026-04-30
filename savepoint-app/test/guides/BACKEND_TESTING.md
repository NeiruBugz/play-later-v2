# Backend & Service Testing Guide

> **Note:** this guide previously documented the `Result`-wrapper testing patterns that the DAL used through 2026-04. Those patterns no longer apply. See the canonical sources of truth below.

## Where to look

- **Test conventions, projects, factories, MSW, fixtures**: [`test/CLAUDE.md`](../CLAUDE.md)
- **Service / repository error model and how to test it**: [`data-access-layer/CLAUDE.md`](../../data-access-layer/CLAUDE.md) Error Model section
- **Per-layer testing rules**: [`data-access-layer/services/CLAUDE.md`](../../data-access-layer/services/CLAUDE.md) and [`data-access-layer/repository/CLAUDE.md`](../../data-access-layer/repository/CLAUDE.md)
- **Design rationale for the typed-throw error model**: [`context/decisions/DAL_TYPED_THROW.md`](../../../context/decisions/DAL_TYPED_THROW.md)

## At a glance — backend (service) test pattern

```typescript
import { NotFoundError } from "@/shared/lib/errors";

describe("MyService", () => {
  beforeEach(() => {
    vi.resetAllMocks(); // not clearAllMocks — drains mockResolvedValueOnce queues
  });

  it("returns the data", async () => {
    mockRepoCall.mockResolvedValue(rowFixture);

    const result = await service.getById(id);

    expect(result).toEqual(expectedFixture);
  });

  it("throws NotFoundError when missing", async () => {
    mockRepoCall.mockResolvedValue(null);

    await expect(service.getById(id)).rejects.toThrow(NotFoundError);
  });
});
```

Mock typed-error throws via `mockRejectedValue(new SomeTypedError(...))`. Always import error classes from `@/shared/lib/errors` (or co-located `services/<domain>/errors.ts`); never from any other path — class identity matters for `instanceof` checks.

## Server-action test pattern

Server actions are wrapped by `createServerAction`, which catches throws and serializes them into `ActionResult.error`. Mock the underlying service to throw and assert on the action's `result.error`:

```typescript
mockService.getById.mockRejectedValue(new NotFoundError("Not found"));

const result = await myAction({ id: "missing" });

expect(result.success).toBe(false);
if (!result.success) {
  expect(result.error).toBe("Not found");
}
```

## Integration tests

Repository integration tests run against real PostgreSQL via Docker. Assert raw return values directly; assert error paths via `await expect(...).rejects.toThrow(NotFoundError|ConflictError|...)`. See [`test/CLAUDE.md`](../CLAUDE.md) for setup, factories, and database isolation.
