import { describe, expect, it } from "vitest";

import { extractCoverTint } from "./cover-tint";

type Rgb = [number, number, number];

const IMAGE_PIXELS = 1_000;
const RED: Rgb = [220, 30, 30];
const RED_HUE = 28;
const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];
const GREEN: Rgb = [30, 180, 60];
const TOLERANCE_DEGREES = 12;

function encode(channel: number) {
  return channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * channel ** (1 / 2.4) - 0.055;
}

function rgbFromOklch(lightness: number, chroma: number, hue: number): Rgb {
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((channel) =>
    Math.round(255 * encode(Math.min(1, Math.max(0, channel))))
  ) as Rgb;
}

function image(...regions: [share: number, color: Rgb][]): Uint8Array {
  const rgba: number[] = [];
  for (const [share, [r, g, b]] of regions) {
    for (let i = 0; i < Math.round(IMAGE_PIXELS * share); i++) {
      rgba.push(r, g, b, 255);
    }
  }
  return Uint8Array.from(rgba);
}

function circularDistance(a: number, b: number) {
  const gap = Math.abs(a - b) % 360;
  return Math.min(gap, 360 - gap);
}

describe(extractCoverTint, () => {
  describe("given a mostly red cover with a dark border", () => {
    it("returns a red hue and a visible chroma", () => {
      const tint = extractCoverTint(image([0.8, RED], [0.2, BLACK]));

      expect(tint).not.toBeNull();
      expect(circularDistance(tint!.hue, RED_HUE)).toBeLessThan(
        TOLERANCE_DEGREES
      );
      expect(tint!.chroma).toBeGreaterThan(0.1);
    });
  });

  describe("given a cover with two colors", () => {
    it("returns the hue of the one that covers more of the image", () => {
      const tint = extractCoverTint(image([0.3, RED], [0.7, GREEN]));

      expect(circularDistance(tint!.hue, 145)).toBeLessThan(
        TOLERANCE_DEGREES * 2
      );
    });
  });

  describe("given a greyscale cover", () => {
    it("returns no tint", () => {
      const greys: [number, Rgb][] = [0.2, 0.4, 0.6, 0.8, 1].map((level) => [
        0.2,
        [level * 255, level * 255, level * 255],
      ]);

      expect(extractCoverTint(image(...greys))).toBeNull();
    });
  });

  describe("given a white cover with a small colored logo", () => {
    it("returns no tint", () => {
      expect(extractCoverTint(image([0.96, WHITE], [0.04, RED]))).toBeNull();
    });
  });

  describe("given a black cover with a small colored logo", () => {
    it("returns no tint", () => {
      expect(extractCoverTint(image([0.96, BLACK], [0.04, RED]))).toBeNull();
    });
  });

  describe("given a cover where color fills a tenth of the image", () => {
    it("still returns a tint", () => {
      expect(extractCoverTint(image([0.9, WHITE], [0.1, RED]))).not.toBeNull();
    });
  });

  describe("given a red that straddles 0 degrees (355 and 5)", () => {
    it("returns a hue near 0, not the opposite side of the wheel", () => {
      const tint = extractCoverTint(
        image(
          [0.4, rgbFromOklch(0.65, 0.15, 355)],
          [0.4, rgbFromOklch(0.65, 0.15, 5)],
          [0.2, BLACK]
        )
      );

      expect(circularDistance(tint!.hue, 0)).toBeLessThan(TOLERANCE_DEGREES);
    });
  });
});
