import { describe, expect, it } from "vitest";

import { computeLifecycleStrip } from "./lifecycle-strip.utility";

const NOW = new Date("2026-05-23T12:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

describe("computeLifecycleStrip", () => {
  describe("given a completed item", () => {
    const model = computeLifecycleStrip({
      status: "PLAYED",
      createdAt: daysAgo(90),
      startedAt: daysAgo(80),
      completedAt: daysAgo(10),
      now: NOW,
    });

    it("uses the completed tone and labels the right edge with the finish elapsed", () => {
      expect(model.tone).toBe("completed");
      expect(model.endLabel).toContain("done");
    });

    it("fills from the start marker to the completion point, not the full bar", () => {
      expect(model.fillStartPct).toBeGreaterThan(0);
      expect(model.fillEndPct).toBeLessThan(100);
      expect(model.fillEndPct).toBeGreaterThan(model.fillStartPct);
    });

    it("includes all three timestamps in the hover title", () => {
      expect(model.hoverTitle).toContain("Added");
      expect(model.hoverTitle).toContain("Started");
      expect(model.hoverTitle).toContain("Completed");
    });
  });

  describe("given an in-progress (PLAYING) item", () => {
    const model = computeLifecycleStrip({
      status: "PLAYING",
      createdAt: daysAgo(41),
      startedAt: daysAgo(18),
      completedAt: null,
      now: NOW,
    });

    it("uses the playing tone and fills through to the present", () => {
      expect(model.tone).toBe("playing");
      expect(model.fillEndPct).toBe(100);
    });

    it("labels the right edge with elapsed time since starting", () => {
      expect(model.endLabel).toBe("started 3w");
    });
  });

  describe("given an untouched shelf item", () => {
    const model = computeLifecycleStrip({
      status: "SHELF",
      createdAt: daysAgo(320),
      startedAt: null,
      completedAt: null,
      now: NOW,
    });

    it("renders an empty track with no marker and an em-dash label", () => {
      expect(model.tone).toBe("idle");
      expect(model.fillEndPct).toBe(0);
      expect(model.startMarkerPct).toBeNull();
      expect(model.endLabel).toBe("—");
    });
  });

  describe("given a tried-then-shelved item (started, no completion, not playing)", () => {
    const model = computeLifecycleStrip({
      status: "SHELF",
      createdAt: daysAgo(200),
      startedAt: daysAgo(150),
      completedAt: null,
      now: NOW,
    });

    it("keeps the start marker and reads as started with no active fill", () => {
      expect(model.startMarkerPct).not.toBeNull();
      expect(model.tone).toBe("idle");
      expect(model.endLabel).toBe("started 5mo");
    });
  });
});
