import { describe, expect, it } from "vitest";

import { getSteamIconUrl } from "./imported-game-card.utility";

describe("getSteamIconUrl", () => {
  it("returns null when imgIconUrl is null", () => {
    expect(getSteamIconUrl(null, "220")).toBeNull();
  });

  it("returns null when storefrontGameId is null", () => {
    expect(getSteamIconUrl("abc123", null)).toBeNull();
  });

  it("returns null when imgIconUrl is an empty string", () => {
    expect(getSteamIconUrl("", "220")).toBeNull();
  });

  it("returns the Steam CDN URL when both arguments are provided", () => {
    const url = getSteamIconUrl("abc123", "220");
    expect(url).toBe(
      "https://media.steampowered.com/steamcommunity/public/images/apps/220/abc123.jpg"
    );
  });
});
