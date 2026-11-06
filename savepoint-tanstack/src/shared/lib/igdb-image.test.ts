import { describe, expect, it } from "vitest";

import {
  buildCoverImageProps,
  buildCoverImageUrl,
  buildScreenshotThumbUrl,
} from "./igdb-image";

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

describe("buildCoverImageProps", () => {
  it("returns null without a cover", () => {
    expect(buildCoverImageProps(null)).toBeNull();
  });

  it("serves t_cover_big with a t_cover_big_2x candidate for dense displays", () => {
    expect(buildCoverImageProps("co9wzc")).toEqual({
      src: "https://images.igdb.com/igdb/image/upload/t_cover_big/co9wzc.jpg",
      srcSet:
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co9wzc.jpg 1x, https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co9wzc.jpg 2x",
    });
  });

  it("serves t_cover_small with a t_cover_big candidate for dense displays", () => {
    expect(buildCoverImageProps("co9wzc", "t_cover_small")).toEqual({
      src: "https://images.igdb.com/igdb/image/upload/t_cover_small/co9wzc.jpg",
      srcSet:
        "https://images.igdb.com/igdb/image/upload/t_cover_small/co9wzc.jpg 1x, https://images.igdb.com/igdb/image/upload/t_cover_big/co9wzc.jpg 2x",
    });
  });

  it("serves t_cover_big_2x as a single candidate", () => {
    expect(buildCoverImageProps("co9wzc", "t_cover_big_2x")).toEqual({
      src: "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co9wzc.jpg",
      srcSet: undefined,
    });
  });

  it("leaves non-IGDB URLs as a single candidate", () => {
    expect(buildCoverImageProps("https://cdn.example.com/foo.jpg")).toEqual({
      src: "https://cdn.example.com/foo.jpg",
      srcSet: undefined,
    });
  });
});

describe("buildScreenshotThumbUrl", () => {
  it("serves the medium screenshot size", () => {
    expect(buildScreenshotThumbUrl("sc1")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_screenshot_med/sc1.jpg"
    );
  });
});
