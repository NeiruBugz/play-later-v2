import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  join(resolve(__dirname, "../.."), "src/styles.css"),
  "utf8"
);

function blockStartingWith(opening: string, source = stylesheet): string {
  const start = source.indexOf(opening);
  expect(start, `${opening} is in the stylesheet`).toBeGreaterThan(-1);
  let depth = 0;
  for (let index = source.indexOf("{", start); index < source.length; index++) {
    if (source[index] === "{") depth++;
    if (source[index] === "}" && --depth === 0) {
      return source.slice(start, index + 1);
    }
  }
  throw new Error(`${opening} is never closed`);
}

function lightnessOf(block: string, token: string): number {
  const match = block.match(new RegExp(`--${token}:\\s*oklch\\(([0-9.]+)`));
  expect(match, `--${token} is an oklch colour`).not.toBeNull();
  return Number(match![1]);
}

const coverTint = blockStartingWith("@utility cover-tint");
const darkTint = blockStartingWith("&:is(.dark *)", coverTint);
const neutralTint = blockStartingWith('&[data-tint="off"]', coverTint);
const reducedMotion = blockStartingWith(
  "@media (prefers-reduced-motion: reduce)"
);

describe("@spec: 028-continue-identity-stand-out @regression cover tint surfaces", () => {
  describe("given a cover with a hue", () => {
    it("washes the surface with that hue, pale in Light", () => {
      expect(coverTint).toMatch(
        /--tint-wash:\s*oklch\([0-9.]+ var\(--tint-chroma\) var\(--tint-h, 0\)\)/
      );
      expect(lightnessOf(coverTint, "tint-wash")).toBeGreaterThan(0.85);
      expect(coverTint).toContain("background-color: var(--tint-wash)");
    });

    it("washes the surface with that hue, deep in Dark", () => {
      expect(darkTint).toMatch(
        /--tint-wash:\s*oklch\([0-9.]+ var\(--tint-chroma\) var\(--tint-h, 0\)\)/
      );
      expect(lightnessOf(darkTint, "tint-wash")).toBeLessThan(0.35);
    });
  });

  describe("given a black-and-white cover", () => {
    it("uses the plain neutral card colour with no tint", () => {
      expect(neutralTint).toContain("--tint-wash: var(--card)");
      expect(neutralTint).toContain("--tint-ink: var(--foreground)");
    });
  });

  describe("given reduce motion is turned on", () => {
    it("removes animations and transitions so the next question appears without a fade", () => {
      expect(reducedMotion).toMatch(/animation-duration:\s*0\.01ms !important/);
      expect(reducedMotion).toMatch(
        /transition-duration:\s*0\.01ms !important/
      );
    });
  });
});
