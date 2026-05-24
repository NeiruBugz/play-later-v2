import { describe, expect, it } from "vitest";

import { buildCoverImageUrl } from "./igdb-image";

describe("buildCoverImageUrl", () => {
  it("returns null when input is null", () => {
    expect(buildCoverImageUrl(null)).toBeNull();
  });

  it("returns null when input is undefined", () => {
    expect(buildCoverImageUrl(undefined)).toBeNull();
  });

  it("builds a full IGDB URL from a bare imageId at t_720p by default", () => {
    expect(buildCoverImageUrl("co9wzc")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_720p/co9wzc.jpg"
    );
  });

  it("honors the size argument when building from a bare imageId", () => {
    expect(buildCoverImageUrl("co9wzc", "t_cover_big_2x")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co9wzc.jpg"
    );
  });

  it("upgrades an IGDB t_thumb URL to t_720p by default", () => {
    expect(
      buildCoverImageUrl(
        "https://images.igdb.com/igdb/image/upload/t_thumb/co1.jpg"
      )
    ).toBe("https://images.igdb.com/igdb/image/upload/t_720p/co1.jpg");
  });

  it("honors the size argument when upgrading a URL", () => {
    expect(
      buildCoverImageUrl(
        "https://images.igdb.com/igdb/image/upload/t_thumb/co1.jpg",
        "t_cover_big_2x"
      )
    ).toBe("https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co1.jpg");
  });

  it("passes through non-IGDB URLs unchanged", () => {
    expect(buildCoverImageUrl("https://cdn.example.com/foo.jpg")).toBe(
      "https://cdn.example.com/foo.jpg"
    );
  });
});
