import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { STATUS_VARIANTS_WITH_CONTRAST_CHECK } from "./contrast-status-variants";

type Rgb = [number, number, number];
type Mode = "light" | "dark";

const css = readFileSync(resolve(__dirname, "../../styles.css"), "utf8");

function tokensOf(selectorLine: string): Record<string, string> {
  const start = css.indexOf(`\n${selectorLine}`) + 1;
  const end = css.indexOf("\n}", start);
  const tokens: Record<string, string> = {};
  for (const match of css
    .slice(start, end)
    .matchAll(/--([a-z-]+):\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

const tokensByMode: Record<Mode, Record<string, string>> = {
  light: tokensOf(":root {\n  /* Theme"),
  dark: tokensOf(".dark {"),
};

function encode(channel: number) {
  return channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * channel ** (1 / 2.4) - 0.055;
}

function decode(channel: number) {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function oklchToLinearRgb(value: string): Rgb {
  const match = value.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
  if (!match) throw new Error(`Not an oklch() value: ${value}`);
  const [lightness, chroma, hue] = [match[1], match[2], match[3]].map(Number);
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((channel) => Math.min(1, Math.max(0, channel))) as Rgb;
}

function token(mode: Mode, name: string): Rgb {
  let value = tokensByMode[mode][name];
  while (value?.startsWith("var(")) {
    value = tokensByMode[mode][value.slice(6, -1)];
  }
  if (!value) throw new Error(`Token --${name} not found in ${mode}`);
  return oklchToLinearRgb(value);
}

const WHITE: Rgb = [1, 1, 1];

function composite(foreground: Rgb, background: Rgb, alpha: number): Rgb {
  return foreground.map((channel, index) => {
    const mixed =
      encode(channel) * alpha + encode(background[index]) * (1 - alpha);
    return decode(mixed);
  }) as Rgb;
}

function luminance([r, g, b]: Rgb) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: Rgb, background: Rgb) {
  const [high, low] = [luminance(foreground), luminance(background)].sort(
    (x, y) => y - x
  );
  return (high + 0.05) / (low + 0.05);
}

const TEXT = 4.5;
const GRAPHIC = 3;
const modes: Mode[] = ["light", "dark"];

describe.each(modes)("contrast in %s", (mode) => {
  const at = (name: string) => token(mode, name);
  const tint = (name: string, surface: string, alpha: number) =>
    composite(at(name), at(surface), alpha);
  const destructiveTint = mode === "dark" ? 0.15 : 0.1;
  const destructiveHover = mode === "dark" ? 0.2 : 0.15;

  it.each(["background", "card", "popover"])("body text on %s", (surface) => {
    const text =
      surface === "background" ? "foreground" : `${surface}-foreground`;
    expect(contrast(at(text), at(surface))).toBeGreaterThanOrEqual(TEXT);
  });

  it.each(["background", "card", "popover", "muted", "secondary", "accent"])(
    "muted text on %s",
    (surface) => {
      expect(
        contrast(at("muted-foreground"), at(surface))
      ).toBeGreaterThanOrEqual(TEXT);
    }
  );

  it("placeholder on the translucent input over card", () => {
    expect(
      contrast(at("muted-foreground"), tint("input", "card", 0.3))
    ).toBeGreaterThanOrEqual(TEXT);
  });

  it("primary button text, resting and hovered", () => {
    expect(
      contrast(at("primary-foreground"), at("primary"))
    ).toBeGreaterThanOrEqual(TEXT);
    expect(
      contrast(at("primary-foreground"), tint("primary", "background", 0.9))
    ).toBeGreaterThanOrEqual(TEXT);
  });

  it.each(["card", "background"])(
    "destructive text on %s, tint and hover tint",
    (surface) => {
      expect(contrast(at("destructive"), at(surface))).toBeGreaterThanOrEqual(
        TEXT
      );
      expect(
        contrast(
          at("destructive"),
          tint("destructive", surface, destructiveTint)
        )
      ).toBeGreaterThanOrEqual(TEXT);
      expect(
        contrast(
          at("destructive"),
          tint("destructive", surface, destructiveHover)
        )
      ).toBeGreaterThanOrEqual(TEXT);
    }
  );

  it.each(["success", "warning", "info", "destructive"])(
    "alert %s text and description on card",
    (name) => {
      expect(contrast(at(name), at("card"))).toBeGreaterThanOrEqual(TEXT);
      expect(
        contrast(tint(name, "card", 0.9), at("card"))
      ).toBeGreaterThanOrEqual(TEXT);
    }
  );

  it.each(STATUS_VARIANTS_WITH_CONTRAST_CHECK)(
    "status %s chip text",
    (status) => {
      expect(
        contrast(at(`status-${status}-foreground`), at(`status-${status}`))
      ).toBeGreaterThanOrEqual(TEXT);
    }
  );

  it.each(["background", "card", "popover"])(
    "accent text (links) on %s",
    (surface) => {
      expect(contrast(at("accent-text"), at(surface))).toBeGreaterThanOrEqual(
        TEXT
      );
    }
  );

  it("primary fill against the page, as a graphic", () => {
    expect(contrast(at("primary"), at("background"))).toBeGreaterThanOrEqual(
      GRAPHIC
    );
    expect(contrast(at("primary"), at("card"))).toBeGreaterThanOrEqual(GRAPHIC);
  });

  it("text over the 60 percent scrim on a white cover", () => {
    expect(
      contrast(at("scrim-foreground"), composite(at("scrim"), WHITE, 0.6))
    ).toBeGreaterThanOrEqual(TEXT);
  });

  it("rating stars on card and background", () => {
    expect(contrast(at("warning"), at("card"))).toBeGreaterThanOrEqual(GRAPHIC);
    expect(contrast(at("warning"), at("background"))).toBeGreaterThanOrEqual(
      GRAPHIC
    );
  });

  it.each(["background", "card"])(
    "queue marker: accent text on primary/5 over %s",
    (surface) => {
      expect(
        contrast(at("accent-text"), tint("primary", surface, 0.05))
      ).toBeGreaterThanOrEqual(TEXT);
    }
  );

  it("active filter chip count: primary-foreground on primary at full opacity", () => {
    expect(
      contrast(at("primary-foreground"), at("primary"))
    ).toBeGreaterThanOrEqual(TEXT);
  });

  it("card menu trigger focus: scrim-foreground ring plus scrim outer ring hold 3:1 on any cover", () => {
    for (let level = 0; level <= 100; level += 1) {
      const cover: Rgb = [level / 100, level / 100, level / 100];
      const best = Math.max(
        contrast(at("scrim-foreground"), cover),
        contrast(at("scrim"), cover)
      );
      expect(best).toBeGreaterThanOrEqual(GRAPHIC);
    }
  });

  it.each(["background", "card", "popover", "accent", "muted", "secondary"])(
    "focus ring against %s",
    (surface) => {
      expect(contrast(at("ring"), at(surface))).toBeGreaterThanOrEqual(GRAPHIC);
    }
  );
});
