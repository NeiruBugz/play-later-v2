// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { UPDATE_LIBRARY_ITEM_INPUT } from "./update-library-item-fn";

vi.mock("@/entities/library-item/api/update-library-item.server", () => ({
  updateLibraryItem: vi.fn(),
}));
vi.mock("@/entities/session/api/require-user-id", () => ({
  requireUserId: vi.fn(),
}));

describe("UPDATE_LIBRARY_ITEM_INPUT platform", () => {
  it("accepts a platform at the 64 character cap", () => {
    expect(
      UPDATE_LIBRARY_ITEM_INPUT.safeParse({
        itemId: 1,
        platform: "p".repeat(64),
      }).success
    ).toBe(true);
  });

  it("rejects a platform over the cap", () => {
    expect(
      UPDATE_LIBRARY_ITEM_INPUT.safeParse({
        itemId: 1,
        platform: "p".repeat(65),
      }).success
    ).toBe(false);
  });
});
