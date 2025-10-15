import { type Game } from "igdb-api-types";
import { describe, expect, it } from "vitest";

import { getUniquePlatforms } from "./get-unique-platforms";

describe("getUniquePlatforms", () => {
  it("should return an empty array if releaseDates is undefined", () => {
    expect(getUniquePlatforms(undefined)).toEqual([]);
  });

  it("should return an empty array if releaseDates is empty", () => {
    expect(getUniquePlatforms([])).toEqual([]);
  });

  it("should return unique platform names in alphabetical order", () => {
    const releaseDates: Game["release_dates"] = [
      { id: 1, platform: { id: 1, name: "PC" } },
      { id: 2, platform: { id: 2, name: "PlayStation 5" } },
      { id: 3, platform: { id: 1, name: "PC" } },
      { id: 4, platform: { id: 3, name: "Xbox Series X" } },
    ];
    expect(getUniquePlatforms(releaseDates)).toEqual([
      "PC",
      "PlayStation 5",
      "Xbox Series X",
    ]);
  });

  it("should handle a mix of ReleaseDate objects and number IDs", () => {
    // we want to test the function with an array of mixed types

    const releaseDates: any[] = [
      { id: 1, platform: { id: 1, name: "PC" } },
      12345,
      { id: 3, platform: { id: 1, name: "PC" } },
      { id: 4, platform: { id: 3, name: "Xbox Series X" } },
    ];
    expect(getUniquePlatforms(releaseDates)).toEqual(["PC", "Xbox Series X"]);
  });

  it("should handle cases where platform is undefined", () => {
    const releaseDates: Game["release_dates"] = [
      { id: 1, platform: { id: 1, name: "PC" } },
      { id: 2 },
    ];
    expect(getUniquePlatforms(releaseDates)).toEqual(["PC"]);
  });

  it("should handle cases where platform is a number ID", () => {
    const releaseDates: Game["release_dates"] = [
      { id: 1, platform: { id: 1, name: "PC" } },
      { id: 2, platform: 123 },
    ];
    expect(getUniquePlatforms(releaseDates)).toEqual(["PC"]);
  });

  it("should return a sorted list of unique platform names", () => {
    const releaseDates: Game["release_dates"] = [
      { id: 1, platform: { id: 3, name: "Xbox Series X" } },
      { id: 2, platform: { id: 1, name: "PC" } },
      { id: 3, platform: { id: 2, name: "PlayStation 5" } },
    ];
    expect(getUniquePlatforms(releaseDates)).toEqual([
      "PC",
      "PlayStation 5",
      "Xbox Series X",
    ]);
  });
});
