import { describe, expect, it } from "vitest";

import { findSteamAppId } from "./find-steam-app-id";

describe("findSteamAppId", () => {
  it("should return null if no external games are provided", () => {
    const steamAppId = findSteamAppId(undefined);
    expect(steamAppId).toBeNull();
  });

  it("should return null if external games are empty", () => {
    const steamAppId = findSteamAppId([]);
    expect(steamAppId).toBeNull();
  });

  it("should return the steam app id", () => {
    const steamAppId = findSteamAppId([
      {
        id: 1,
        category: 1,
        name: "Test",
        url: "https://store.steampowered.com/app/1234567890",
      },
    ]);
    expect(steamAppId).toBe(1234567890);
  });

  it("should return null if no steam url is found", () => {
    const steamAppId = findSteamAppId([
      {
        id: 1,
        category: 1,
        name: "Test",
        url: "https://www.google.com",
      },
    ]);
    expect(steamAppId).toBeNull();
  });

  it("should return null if the url is undefined", () => {
    const steamAppId = findSteamAppId([
      { id: 1, category: 1, name: "Test", url: undefined },
    ]);
    expect(steamAppId).toBeNull();
  });
});
