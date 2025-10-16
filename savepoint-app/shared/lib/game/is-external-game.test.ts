import { describe, expect, it } from "vitest";

import { isExternalGameId } from "./is-external-game";

describe("isExternalGameId", () => {
  it("should return true if the game id is a valid external game id", () => {
    const result = isExternalGameId("1234567890");
    expect(result).toBe(true);
  });

  it("should return false if the game id is not a valid external game id", () => {
    const result = isExternalGameId("123c567890");
    expect(result).toBe(false);
  });
});
