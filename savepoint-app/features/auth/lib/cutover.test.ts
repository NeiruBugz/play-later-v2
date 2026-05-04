import { afterEach, describe, expect, it, vi } from "vitest";

// Each test case that needs a specific env value uses the pattern:
//   1. vi.resetModules() — clear the module registry so next import is fresh
//   2. vi.doMock("@/env.mjs", ...) — register a lazy factory (not hoisted)
//   3. dynamic import of the module-under-test — picks up the new mock
//   4. assertions
// This avoids the static vi.mock() hoisting limitation when multiple cases
// need different env values.

type CutoverModule = typeof import("./cutover");

async function loadCutover(
  cutoverAt: string | undefined
): Promise<CutoverModule> {
  vi.resetModules();
  vi.doMock("@/env.mjs", () => ({
    env: { AUTH_MIGRATION_CUTOVER_AT: cutoverAt },
  }));
  return import("./cutover");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("cutover helpers", () => {
  describe("getCutoverAt()", () => {
    it("returns null when AUTH_MIGRATION_CUTOVER_AT is undefined", async () => {
      const { getCutoverAt } = await loadCutover(undefined);
      expect(getCutoverAt()).toBeNull();
    });

    it("returns null when AUTH_MIGRATION_CUTOVER_AT is empty string", async () => {
      const { getCutoverAt } = await loadCutover("");
      expect(getCutoverAt()).toBeNull();
    });

    it("returns null when AUTH_MIGRATION_CUTOVER_AT is a non-date string", async () => {
      const { getCutoverAt } = await loadCutover("not-a-date");
      expect(getCutoverAt()).toBeNull();
    });

    it("returns null when AUTH_MIGRATION_CUTOVER_AT is an impossible date like 2026-99-99", async () => {
      const { getCutoverAt } = await loadCutover("2026-99-99");
      expect(getCutoverAt()).toBeNull();
    });

    it("returns a Date when AUTH_MIGRATION_CUTOVER_AT is a valid ISO-8601 UTC string", async () => {
      const { getCutoverAt } = await loadCutover("2026-06-01T12:00:00.000Z");
      expect(getCutoverAt()).toBeInstanceOf(Date);
      expect(getCutoverAt()!.toISOString()).toBe("2026-06-01T12:00:00.000Z");
    });
  });

  describe("isInBannerWindow(now)", () => {
    describe("when AUTH_MIGRATION_CUTOVER_AT is unset", () => {
      it("returns false", async () => {
        const { isInBannerWindow } = await loadCutover(undefined);
        expect(isInBannerWindow(new Date())).toBe(false);
      });
    });

    describe("when AUTH_MIGRATION_CUTOVER_AT is malformed", () => {
      it("returns false for 'not-a-date'", async () => {
        const { isInBannerWindow } = await loadCutover("not-a-date");
        expect(isInBannerWindow(new Date())).toBe(false);
      });

      it("returns false for empty string", async () => {
        const { isInBannerWindow } = await loadCutover("");
        expect(isInBannerWindow(new Date())).toBe(false);
      });

      it("returns false for an impossible date like 2026-99-99", async () => {
        const { isInBannerWindow } = await loadCutover("2026-99-99");
        expect(isInBannerWindow(new Date())).toBe(false);
      });
    });

    describe("when AUTH_MIGRATION_CUTOVER_AT is a valid ISO-8601 UTC string", () => {
      const CUTOVER_ISO = "2026-06-01T12:00:00.000Z";
      const cutoverMs = new Date(CUTOVER_ISO).getTime();

      it("returns false at exactly cutoverAt (isPostCutover takes over)", async () => {
        const { isInBannerWindow } = await loadCutover(CUTOVER_ISO);
        expect(isInBannerWindow(new Date(cutoverMs))).toBe(false);
      });

      it("returns true 1ms before cutoverAt", async () => {
        const { isInBannerWindow } = await loadCutover(CUTOVER_ISO);
        expect(isInBannerWindow(new Date(cutoverMs - 1))).toBe(true);
      });

      it("returns true at exactly cutoverAt - BANNER_WINDOW_MS (window start)", async () => {
        const { isInBannerWindow, BANNER_WINDOW_MS } =
          await loadCutover(CUTOVER_ISO);
        expect(isInBannerWindow(new Date(cutoverMs - BANNER_WINDOW_MS))).toBe(
          true
        );
      });

      it("returns false 1ms before cutoverAt - BANNER_WINDOW_MS (before window)", async () => {
        const { isInBannerWindow, BANNER_WINDOW_MS } =
          await loadCutover(CUTOVER_ISO);
        expect(
          isInBannerWindow(new Date(cutoverMs - BANNER_WINDOW_MS - 1))
        ).toBe(false);
      });

      it("returns true at 48h - 1s before cutoverAt (inside window)", async () => {
        const { isInBannerWindow, BANNER_WINDOW_MS } =
          await loadCutover(CUTOVER_ISO);
        const almostWindowStart = new Date(cutoverMs - BANNER_WINDOW_MS + 1000);
        expect(isInBannerWindow(almostWindowStart)).toBe(true);
      });

      it("returns false well before the banner window", async () => {
        const { isInBannerWindow, BANNER_WINDOW_MS } =
          await loadCutover(CUTOVER_ISO);
        const wayBefore = new Date(
          cutoverMs - BANNER_WINDOW_MS - 7 * 24 * 60 * 60 * 1000
        );
        expect(isInBannerWindow(wayBefore)).toBe(false);
      });

      it("returns false well after cutoverAt", async () => {
        const { isInBannerWindow } = await loadCutover(CUTOVER_ISO);
        const dayAfter = new Date(cutoverMs + 24 * 60 * 60 * 1000);
        expect(isInBannerWindow(dayAfter)).toBe(false);
      });
    });
  });

  describe("isPostCutover(now)", () => {
    describe("when AUTH_MIGRATION_CUTOVER_AT is unset", () => {
      it("returns false", async () => {
        const { isPostCutover } = await loadCutover(undefined);
        expect(isPostCutover(new Date())).toBe(false);
      });
    });

    describe("when AUTH_MIGRATION_CUTOVER_AT is malformed", () => {
      it("returns false for 'not-a-date'", async () => {
        const { isPostCutover } = await loadCutover("not-a-date");
        expect(isPostCutover(new Date())).toBe(false);
      });

      it("returns false for empty string", async () => {
        const { isPostCutover } = await loadCutover("");
        expect(isPostCutover(new Date())).toBe(false);
      });

      it("returns false for an impossible date like 2026-99-99", async () => {
        const { isPostCutover } = await loadCutover("2026-99-99");
        expect(isPostCutover(new Date())).toBe(false);
      });
    });

    describe("when AUTH_MIGRATION_CUTOVER_AT is a valid ISO-8601 UTC string", () => {
      const CUTOVER_ISO = "2026-06-01T12:00:00.000Z";
      const cutoverMs = new Date(CUTOVER_ISO).getTime();

      it("returns true at exactly cutoverAt", async () => {
        const { isPostCutover } = await loadCutover(CUTOVER_ISO);
        expect(isPostCutover(new Date(cutoverMs))).toBe(true);
      });

      it("returns false 1ms before cutoverAt", async () => {
        const { isPostCutover } = await loadCutover(CUTOVER_ISO);
        expect(isPostCutover(new Date(cutoverMs - 1))).toBe(false);
      });

      it("returns true well after cutoverAt (e.g. +1 day)", async () => {
        const { isPostCutover } = await loadCutover(CUTOVER_ISO);
        const dayAfter = new Date(cutoverMs + 24 * 60 * 60 * 1000);
        expect(isPostCutover(dayAfter)).toBe(true);
      });

      it("returns false well before cutoverAt", async () => {
        const { isPostCutover } = await loadCutover(CUTOVER_ISO);
        const { BANNER_WINDOW_MS } = await loadCutover(CUTOVER_ISO);
        const wayBefore = new Date(cutoverMs - BANNER_WINDOW_MS - 1);
        expect(isPostCutover(wayBefore)).toBe(false);
      });
    });
  });

  describe("boundary: isPostCutover and isInBannerWindow are mutually exclusive at cutoverAt", () => {
    const CUTOVER_ISO = "2026-06-01T12:00:00.000Z";
    const cutoverMs = new Date(CUTOVER_ISO).getTime();

    it("at cutoverAt: isPostCutover is true and isInBannerWindow is false", async () => {
      const { isPostCutover, isInBannerWindow } =
        await loadCutover(CUTOVER_ISO);
      const now = new Date(cutoverMs);
      expect(isPostCutover(now)).toBe(true);
      expect(isInBannerWindow(now)).toBe(false);
    });

    it("1ms before cutoverAt: isPostCutover is false and isInBannerWindow is true", async () => {
      const { isPostCutover, isInBannerWindow } =
        await loadCutover(CUTOVER_ISO);
      const now = new Date(cutoverMs - 1);
      expect(isPostCutover(now)).toBe(false);
      expect(isInBannerWindow(now)).toBe(true);
    });
  });
});
