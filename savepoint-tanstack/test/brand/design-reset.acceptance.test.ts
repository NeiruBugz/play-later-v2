/**
 * @spec: 027-design-reset
 * @regression
 *
 * Acceptance-level static checks over the source and the stylesheet: the
 * criteria of spec 027 that are about tokens, fonts and leftovers rather than
 * about one component's behaviour.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = resolve(__dirname, "../..");
const srcRoot = join(appRoot, "src");

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

const productionSourceFiles = listFiles(srcRoot).filter(
  (path) =>
    /\.(ts|tsx)$/.test(path) &&
    !/\.test\.(ts|tsx)$/.test(path) &&
    !path.endsWith("routeTree.gen.ts")
);

function filesMatching(pattern: RegExp, files = productionSourceFiles) {
  return files
    .filter((path) => pattern.test(readFileSync(path, "utf8")))
    .map((path) => relative(appRoot, path))
    .sort();
}

const stylesheet = readFileSync(join(srcRoot, "styles.css"), "utf8");

function tokensOf(selectorLine: string): Record<string, string> {
  const start = stylesheet.indexOf(`\n${selectorLine}`) + 1;
  const end = stylesheet.indexOf("\n}", start);
  const tokens: Record<string, string> = {};
  for (const match of stylesheet
    .slice(start, end)
    .matchAll(/--([a-z-]+):\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

const tokensByMode = {
  light: tokensOf(":root {\n  /* Theme"),
  dark: tokensOf(".dark {"),
};

function oklchParts(value: string) {
  const match = value.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
  return match
    ? { lightness: +match[1], chroma: +match[2], hue: +match[3] }
    : null;
}

describe("spec 027 design reset", () => {
  describe("given the accent colour (2.9)", () => {
    describe.each(["light", "dark"] as const)("in %s mode", (mode) => {
      it("lies outside the teal/cyan hues 170-220", () => {
        const accent = oklchParts(tokensByMode[mode].primary);
        expect(accent).not.toBeNull();
        expect(
          accent!.hue < 170 || accent!.hue > 220,
          `primary hue ${accent!.hue}`
        ).toBe(true);
      });

      it("leaves no chromatic palette colour in the teal/cyan hues", () => {
        const tealTokens = Object.entries(tokensByMode[mode]).filter(
          ([, value]) => {
            const color = oklchParts(value);
            return (
              color !== null &&
              color.chroma >= 0.04 &&
              color.hue >= 170 &&
              color.hue <= 220
            );
          }
        );
        expect(tealTokens).toEqual([]);
      });

      it("is the colour of the Playing status", () => {
        expect(tokensByMode[mode]["status-playing"]).toBe("var(--primary)");
      });

      it("is the keyboard focus ring colour", () => {
        expect(tokensByMode[mode].ring).toBe("var(--primary)");
      });
    });
  });

  describe("given the title font (2.10)", () => {
    it("is Zilla Slab behind one --font-display token", () => {
      const declarations = [
        ...stylesheet.matchAll(/--font-display:\s*([^;]+);/g),
      ];
      expect(declarations).toHaveLength(1);
      expect(declarations[0][1]).toContain('"Zilla Slab"');
    });

    it("is loaded by the document with swap and two weights", () => {
      const root = readFileSync(join(srcRoot, "routes/__root.tsx"), "utf8");
      const url = root.match(/https:\/\/fonts\.googleapis\.com\/css2\?[^"]+/);
      expect(url?.[0]).toContain("family=Zilla+Slab:wght@500;700");
      expect(url?.[0]).toContain("display=swap");
    });

    it("keeps the body font Geist", () => {
      expect(stylesheet).toMatch(/--font-sans:\s*"Geist"/);
    });

    it("is applied only by the title surfaces", () => {
      expect(filesMatching(/\bfont-display\b/)).toEqual([
        "src/shared/ui/dialog.tsx",
        "src/shared/ui/logo.tsx",
        "src/shared/ui/page-header.tsx",
        "src/shared/ui/sheet.tsx",
        "src/widgets/landing-hero/ui/landing-hero/landing-hero.tsx",
        "src/widgets/up-next-shelf/ui/up-next-shelf/up-next-shelf.tsx",
      ]);
    });

    it("leaves no trace of the retired title font", () => {
      expect(filesMatching(/space[ +_-]?grotesk/i)).toEqual([]);
      expect(stylesheet).not.toMatch(/space[ +_-]?grotesk/i);
    });
  });

  describe("given the palette (2.4)", () => {
    it("keeps raw hex colours out of the source, apart from the theme-color pair", () => {
      expect(filesMatching(/#[0-9a-fA-F]{3,8}\b/)).toEqual([
        "src/shared/config/site.ts",
      ]);
    });

    it("keeps off-palette gradient and glow decorations out of the source", () => {
      expect(
        filesMatching(
          /\b(?:from|via|to)-(?:pink|rose|fuchsia|violet|purple|orange|amber|green|emerald|lime)-\d{2,3}\b|\bblur-3xl\b/
        )
      ).toEqual([]);
    });

    it("keeps the retired looks' styling out of the stylesheet", () => {
      expect(stylesheet).not.toMatch(
        /\.(?:paper|boxart|terminal-green|cartridge|aurora|jewel|y2k)\b/i
      );
    });
  });

  describe("given section labels (2.3)", () => {
    it("has no terminal-style label left in the source", () => {
      expect(filesMatching(/terminal-label|TerminalLabel/)).toEqual([]);
      expect(filesMatching(/["'`>]\s*\/\/\s*[A-Z][A-Z ]+/)).toEqual([]);
    });

    it("has no serif profile name or retired body-text colour left", () => {
      expect(filesMatching(/\bfont-serif\b|foreground-body/)).toEqual([]);
    });
  });

  describe("given the landing page (2.5)", () => {
    it("is not forced into dark and follows the visitor's theme", () => {
      const landingFiles = listFiles(srcRoot).filter(
        (path) =>
          !/\.test\./.test(path) &&
          /(routes\/index\.tsx|widgets\/landing-[^/]+\/.*\.tsx)$/.test(path)
      );
      expect(landingFiles.length).toBeGreaterThan(0);
      expect(
        filesMatching(/(?:^|[\s"'`])dark(?:[\s"'`]|$)/, landingFiles)
      ).toEqual([]);
    });
  });

  describe("given covers (2.11)", () => {
    it("defines the 2:3 cover proportion only in the shared cover and its skeleton", () => {
      expect(filesMatching(/aspect-\[2\/3\]/)).toEqual([
        "src/features/browse-related-games/ui/related-games-skeleton/related-games-skeleton.tsx",
        "src/shared/ui/game-cover/game-cover.tsx",
      ]);
    });
  });

  describe("given phone legibility (2.6)", () => {
    it("sets no text below 12 points", () => {
      const tooSmall = productionSourceFiles.flatMap((path) =>
        [
          ...readFileSync(path, "utf8").matchAll(
            /text-\[(\d+(?:\.\d+)?)(px|rem)\]/g
          ),
        ]
          .filter(([, size, unit]) => (unit === "px" ? +size : +size * 16) < 12)
          .map((match) => `${relative(appRoot, path)}: ${match[0]}`)
      );
      expect(tooSmall).toEqual([]);
    });

    it("keeps typed text at 16 points on a phone so the browser does not zoom in", () => {
      for (const file of ["input.tsx", "textarea.tsx", "select.tsx"]) {
        const source = readFileSync(join(srcRoot, "shared/ui", file), "utf8");
        expect(source, file).toMatch(/\btext-base\b[^"]*\bmd:text-sm\b/);
      }
    });

    it("lets the page use the area behind the notch and allows pinch zoom", () => {
      const root = readFileSync(join(srcRoot, "routes/__root.tsx"), "utf8");
      const viewport = root.match(/name:\s*"viewport",\s*content:\s*"([^"]+)"/);
      expect(viewport?.[1]).toContain("viewport-fit=cover");
      expect(viewport?.[1]).not.toMatch(/maximum-scale|user-scalable/);
    });

    it("keeps the bottom navigation and top bar clear of the home indicator and notch", () => {
      const bottomNav = readFileSync(
        join(
          srcRoot,
          "widgets/app-bottom-nav/ui/app-bottom-nav/app-bottom-nav.tsx"
        ),
        "utf8"
      );
      const topBar = readFileSync(
        join(
          srcRoot,
          "widgets/app-mobile-topbar/ui/app-mobile-topbar/app-mobile-topbar.tsx"
        ),
        "utf8"
      );
      expect(bottomNav).toMatch(/\bpb-safe\b/);
      expect(topBar).toMatch(/\bpt-safe\b/);
    });
  });
});
