import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

import { THEME_COLORS } from "@/shared/config/site";

import { Route } from "./manifest[.]json";

const publicDir = resolve(__dirname, "../../public");

describe("manifest route", () => {
  describe("given a GET request", () => {
    let response: Response;
    let manifest: {
      name: string;
      short_name: string;
      start_url: string;
      theme_color: string;
      background_color: string;
      icons: Array<{
        src: string;
        sizes: string;
        type: string;
        purpose?: string;
      }>;
    };

    beforeEach(async () => {
      const handlers = (Route.options as any).server.handlers;
      response = await handlers.GET();
      manifest = await response.clone().json();
    });

    it("is served as a web manifest", () => {
      expect(response.headers.get("Content-Type")).toBe(
        "application/manifest+json"
      );
    });

    it("names the app Continue? in full and short form", () => {
      expect([manifest.name, manifest.short_name]).toEqual([
        "Continue?",
        "Continue?",
      ]);
    });

    it("opens the app at the root", () => {
      expect(manifest.start_url).toBe("/");
    });

    it("colours the splash and the chrome from the Light theme colour", () => {
      expect([manifest.theme_color, manifest.background_color]).toEqual([
        THEME_COLORS.light,
        THEME_COLORS.light,
      ]);
    });

    it("lists the 192 and 512 icons, each in any and maskable form", () => {
      const sized = manifest.icons.filter((icon) => icon.type === "image/png");
      expect(
        sized.map(({ sizes, purpose }) => `${sizes} ${purpose}`).sort()
      ).toEqual([
        "192x192 any",
        "192x192 maskable",
        "512x512 any",
        "512x512 maskable",
      ]);
    });

    it("ships every listed icon file in public/", () => {
      const missing = manifest.icons
        .map((icon) => icon.src)
        .filter((src) => !existsSync(resolve(publicDir, `.${src}`)));
      expect(missing).toEqual([]);
    });
  });
});
