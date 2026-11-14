import { describe, expect, it } from "vitest";

import { getSteamIconUrl, matchState } from "./imported-game-card.utility";

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

describe(matchState, () => {
  const lookedUpAt = new Date("2026-11-14T10:00:00.000Z");

  it("is found when the sync linked the game to the catalogue", () => {
    expect(matchState({ gameId: "game-1", lookedUpAt })).toBe("found");
  });

  it("is needs-match when the game was looked up but nothing was linked", () => {
    expect(matchState({ gameId: null, lookedUpAt })).toBe("needs-match");
  });

  it("is not-yet when the game was never looked up", () => {
    expect(matchState({ gameId: null, lookedUpAt: null })).toBe("not-yet");
  });
});
