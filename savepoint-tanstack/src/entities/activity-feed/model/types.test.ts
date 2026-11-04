import { describe, expect, it } from "vitest";

import { FeedCursorSchema } from "./types";

describe("FeedCursorSchema timestamp", () => {
  it("accepts the ISO string the feed itself emits", () => {
    expect(
      FeedCursorSchema.safeParse({
        timestamp: new Date("2026-01-02T03:04:05.678Z").toISOString(),
        id: 1,
      }).success
    ).toBe(true);
  });

  it.each(["", "yesterday", "2026-13-45", "1; DROP TABLE x", "x".repeat(5000)])(
    "rejects the malformed cursor timestamp #%#",
    (timestamp) => {
      expect(FeedCursorSchema.safeParse({ timestamp, id: 1 }).success).toBe(
        false
      );
    }
  );
});
