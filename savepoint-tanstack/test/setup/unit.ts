import "@testing-library/jest-dom";

import { afterEach, beforeEach, vi } from "vitest";

// Activate the fake-timer pool configured in vitest.config.ts
// (`toFake: ["setTimeout", "clearTimeout"]` with `shouldAdvanceTime: true`).
// The config supplies defaults; `vi.useFakeTimers()` is what actually swaps
// the timer functions on globalThis. Without this call, tests that drive
// debounce logic via `vi.advanceTimersByTime(...)` fail with "the timers
// APIs are not mocked". `shouldAdvanceTime: true` keeps unrelated tests
// behaving like real-time (timers still fire automatically), so this is a
// no-op for tests that don't touch timers manually.
beforeEach(() => {
  vi.useFakeTimers();
});

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof Element !== "undefined" && !Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

vi.mock("@/shared/lib/db.server", () => ({
  prisma: {
    $transaction: vi.fn(),
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    game: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    libraryItem: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    journal: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    journalEntry: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    playthrough: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    account: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
  vi.useRealTimers();
});
