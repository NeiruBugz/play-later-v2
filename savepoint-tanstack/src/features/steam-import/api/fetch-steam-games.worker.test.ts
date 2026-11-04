// @vitest-environment node
import { describe, expect, it } from "vitest";

import { FETCH_STEAM_GAMES_INPUT } from "./fetch-steam-games.worker";

describe("FETCH_STEAM_GAMES_INPUT search", () => {
  it("accepts a search at the cap", () => {
    expect(
      FETCH_STEAM_GAMES_INPUT.safeParse({ search: "s".repeat(200) }).success
    ).toBe(true);
  });

  it("rejects a search over the cap", () => {
    expect(
      FETCH_STEAM_GAMES_INPUT.safeParse({ search: "s".repeat(201) }).success
    ).toBe(false);
  });
});
