import { describe, expect, it } from "vitest";

import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";
import {
  getDoneLabel,
  getQueueMarker,
  getStatusEntry,
  getStatusLabel,
  LIBRARY_STATUS_VALUES,
  libraryItemStatusSchema,
  NEXT_STEP,
  STATUS_ENTRIES,
  UP_NEXT_MAX,
} from "./status";

describe("status values", () => {
  it("lists Want, Playing, Done in display order", () => {
    expect(LIBRARY_STATUS_VALUES).toEqual(["WANT", "PLAYING", "DONE"]);
    expect(STATUS_ENTRIES.map((entry) => entry.value)).toEqual([
      "WANT",
      "PLAYING",
      "DONE",
    ]);
  });

  it("accepts the three statuses in the schema", () => {
    for (const value of LIBRARY_STATUS_VALUES) {
      expect(libraryItemStatusSchema.parse(value)).toBe(value);
    }
  });

  it.each(["SHELF", "UP_NEXT", "WISHLIST", "PLAYED", "want", ""])(
    "rejects old or malformed value %j",
    (value) => {
      expect(libraryItemStatusSchema.safeParse(value).success).toBe(false);
    }
  );
});

describe("labels", () => {
  it("uses title case, never all capitals", () => {
    expect(getStatusLabel("WANT")).toBe("Want");
    expect(getStatusLabel("PLAYING")).toBe("Playing");
    expect(getStatusLabel("DONE")).toBe("Done");
    for (const entry of STATUS_ENTRIES) {
      expect(entry.label).not.toBe(entry.label.toUpperCase());
    }
  });

  it("gives each status an icon and badge variant", () => {
    for (const entry of STATUS_ENTRIES) {
      expect(getStatusEntry(entry.value)).toBe(entry);
      expect(entry.icon).toBeTruthy();
    }
    expect(STATUS_ENTRIES.map((entry) => entry.badgeVariant)).toEqual([
      "want",
      "playing",
      "done",
    ]);
  });

  it("throws on an unknown status", () => {
    expect(() => getStatusEntry("SHELF" as LibraryItemStatus)).toThrow(
      "Unknown library status: SHELF"
    );
  });
});

describe("NEXT_STEP", () => {
  it("maps each status to its next action and target", () => {
    expect(NEXT_STEP.WANT).toEqual({
      label: "Start playing",
      target: "PLAYING",
    });
    expect(NEXT_STEP.PLAYING).toEqual({ label: "Mark done", target: "DONE" });
    expect(NEXT_STEP.DONE).toEqual({ label: "Play again", target: "PLAYING" });
  });
});

describe("getQueueMarker", () => {
  it("shows Up Next #n for a queued Want game", () => {
    expect(getQueueMarker({ status: "WANT", upNextPosition: 1 })).toBe(
      "Up Next #1"
    );
    expect(
      getQueueMarker({ status: "WANT", upNextPosition: UP_NEXT_MAX })
    ).toBe("Up Next #5");
  });

  it("shows Replay for a queued Done game", () => {
    expect(getQueueMarker({ status: "DONE", upNextPosition: 3 })).toBe(
      "Replay"
    );
  });

  it("never shows a marker for Playing", () => {
    expect(getQueueMarker({ status: "PLAYING", upNextPosition: 2 })).toBeNull();
    expect(
      getQueueMarker({ status: "PLAYING", upNextPosition: null })
    ).toBeNull();
  });

  it("shows no marker without a queue position", () => {
    expect(getQueueMarker({ status: "WANT", upNextPosition: null })).toBeNull();
    expect(getQueueMarker({ status: "DONE", upNextPosition: null })).toBeNull();
  });
});

describe("getDoneLabel", () => {
  it("combines Done with the outcome when set", () => {
    expect(getDoneLabel(null)).toBe("Done");
    expect(getDoneLabel("FINISHED")).toBe("Done · Finished");
    expect(getDoneLabel("LET_GO")).toBe("Done · Let go");
  });
});

describe("UP_NEXT_MAX", () => {
  it("is 5", () => {
    expect(UP_NEXT_MAX).toBe(5);
  });
});
