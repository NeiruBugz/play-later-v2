/**
 * Unit tests for library-item status utilities.
 *
 * The `getStatusEntry` function has a defensive throw for unknown status values
 * (unreachable through normal TypeScript usage but exercised here to ensure the
 * error path is covered and the function contract is clear).
 */

import { describe, expect, it } from "vitest";

import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";
import { getStatusEntry, getStatusLabel, STATUS_ENTRIES } from "./status";

describe("getStatusLabel", () => {
  it("returns the correct label for each known status", () => {
    expect(getStatusLabel("WISHLIST")).toBe("Wishlist");
    expect(getStatusLabel("SHELF")).toBe("Shelf");
    expect(getStatusLabel("UP_NEXT")).toBe("Up Next");
    expect(getStatusLabel("PLAYING")).toBe("Playing");
    expect(getStatusLabel("PLAYED")).toBe("Played");
  });
});

describe("getStatusEntry", () => {
  it("returns the matching StatusEntry for each known status", () => {
    for (const entry of STATUS_ENTRIES) {
      const result = getStatusEntry(entry.value);
      expect(result.value).toBe(entry.value);
      expect(result.label).toBe(entry.label);
    }
  });

  it("throws when given an unknown status value (defensive guard)", () => {
    // Cast to LibraryItemStatus to simulate a future schema addition or a bad cast.
    expect(() => getStatusEntry("UNKNOWN_STATUS" as LibraryItemStatus)).toThrow(
      "Unknown library status: UNKNOWN_STATUS"
    );
  });
});
