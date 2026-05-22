import { describe, expect, it } from "vitest";

import { formatPlaytime, getSteamIconUrl } from "./imported-game-card.utility";

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

describe("formatPlaytime", () => {
  it("returns 'Never played' for null", () => {
    expect(formatPlaytime(null)).toBe("Never played");
  });

  it("returns 'Never played' for 0 minutes", () => {
    expect(formatPlaytime(0)).toBe("Never played");
  });

  it("returns minutes-only format when playtime is under one hour", () => {
    // 45 minutes → 0h 45m → hours === 0 branch
    expect(formatPlaytime(45)).toBe("45m");
  });

  it("returns hours-only format when playtime is an exact multiple of 60", () => {
    // 120 minutes → 2h 0m → minutes === 0 branch
    expect(formatPlaytime(120)).toBe("2h");
  });

  it("returns combined hours and minutes format for mixed durations", () => {
    // 135 minutes → 2h 15m
    expect(formatPlaytime(135)).toBe("2h 15m");
  });
});
