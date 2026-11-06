import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildManifest,
  pageTitle,
  PRODUCT_NAME,
  socialMeta,
  THEME_COLORS,
} from "./site";

const appRoot = resolve(__dirname, "../../..");

function oklchToHex(lightness: number, chroma: number, hueDegrees: number) {
  const hue = (hueDegrees * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const channels = linear.map((value) => {
    const clamped = Math.min(1, Math.max(0, value));
    const encoded =
      clamped <= 0.0031308
        ? 12.92 * clamped
        : 1.055 * clamped ** (1 / 2.4) - 0.055;
    return Math.round(encoded * 255)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${channels.join("")}`;
}

function backgroundTokenAsHex(selector: ":root" | ".dark") {
  const css = readFileSync(resolve(appRoot, "src/styles.css"), "utf8");
  const block = css.slice(css.indexOf(`\n${selector} {`));
  const match = block.match(
    /--background:\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/
  );
  if (!match) throw new Error(`--background not found under ${selector}`);
  return oklchToHex(Number(match[1]), Number(match[2]), Number(match[3]));
}

describe("THEME_COLORS", () => {
  it("matches the Light --background token", () => {
    expect(THEME_COLORS.light).toBe(backgroundTokenAsHex(":root"));
  });

  it("matches the Dark --background token", () => {
    expect(THEME_COLORS.dark).toBe(backgroundTokenAsHex(".dark"));
  });

  it("is what the web manifest uses, in its Light value", () => {
    const manifest = buildManifest();
    expect(manifest.theme_color).toBe(THEME_COLORS.light);
    expect(manifest.background_color).toBe(THEME_COLORS.light);
  });
});

describe("pageTitle", () => {
  it("is the product name alone without a part", () => {
    expect(pageTitle()).toBe("Continue?");
  });

  it("puts the part before the product name", () => {
    expect(pageTitle("Hades")).toBe("Hades · Continue?");
  });
});

describe("buildManifest", () => {
  it("opens the app at the root", () => {
    expect(buildManifest().start_url).toBe("/");
  });

  it("names the app with the product name", () => {
    expect(buildManifest()).toMatchObject({
      name: PRODUCT_NAME,
      short_name: PRODUCT_NAME,
    });
  });
});

describe("socialMeta", () => {
  const meta = socialMeta({
    siteOrigin: "https://example.test",
    pathname: "/games/hades",
    title: "Hades",
  });
  const content = (key: string) =>
    meta.find((tag) => ("property" in tag ? tag.property : tag.name) === key)
      ?.content;

  it("builds absolute og:url, og:image and twitter:image", () => {
    expect([
      content("og:url"),
      content("og:image"),
      content("twitter:image"),
    ]).toEqual([
      "https://example.test/games/hades",
      "https://example.test/og-image.png",
      "https://example.test/og-image.png",
    ]);
  });

  it("titles the page through pageTitle", () => {
    expect(content("og:title")).toBe("Hades · Continue?");
  });
});
