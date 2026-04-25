import { resolvePrimaryPlatform } from "./resolve-primary-platform";

describe("resolvePrimaryPlatform", () => {
  const knownPlatforms = [
    { igdbId: 6, name: "PC" },
    { igdbId: 167, name: "PlayStation 5" },
    { igdbId: 169, name: "Xbox Series X|S" },
    { igdbId: null, name: "Legacy entry" },
  ];

  it("returns the first IGDB platform that matches a known platform (first-match ordering)", () => {
    const result = resolvePrimaryPlatform({
      igdbPlatforms: [
        { id: 167, name: "PlayStation 5" },
        { id: 6, name: "PC" },
      ],
      knownPlatforms,
    });

    expect(result).toBe("PlayStation 5");
  });

  it("falls through to subsequent IGDB platforms when earlier ones do not match", () => {
    const result = resolvePrimaryPlatform({
      igdbPlatforms: [
        { id: 9999, name: "Unknown" },
        { id: 6, name: "PC" },
      ],
      knownPlatforms,
    });

    expect(result).toBe("PC");
  });

  it("returns null when no IGDB platform matches a known platform", () => {
    const result = resolvePrimaryPlatform({
      igdbPlatforms: [
        { id: 9001, name: "Unknown A" },
        { id: 9002, name: "Unknown B" },
      ],
      knownPlatforms,
    });

    expect(result).toBeNull();
  });

  it("returns null when igdbPlatforms is empty", () => {
    expect(
      resolvePrimaryPlatform({
        igdbPlatforms: [],
        knownPlatforms,
      })
    ).toBeNull();
  });

  it("returns null when igdbPlatforms is undefined", () => {
    expect(
      resolvePrimaryPlatform({
        igdbPlatforms: undefined,
        knownPlatforms,
      })
    ).toBeNull();
  });

  it("never matches against a known platform whose igdbId is null", () => {
    const result = resolvePrimaryPlatform({
      igdbPlatforms: [{ id: 9999, name: "Some platform" }],
      knownPlatforms: [
        { igdbId: null, name: "Legacy entry" },
        { igdbId: 9999, name: "Some platform" },
      ],
    });

    expect(result).toBe("Some platform");
  });
});
