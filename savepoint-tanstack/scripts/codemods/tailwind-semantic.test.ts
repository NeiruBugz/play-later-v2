import { describe, expect, it } from "vitest";

import { buildMapping, mapClassString } from "./tailwind-semantic.ts";

const prefixOrder = ["gap", "p", "px", "py", "space"];
const scaleOrder = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"];

class ReleaseOneSheetOrder extends Map<string, number> {
  override has(): boolean {
    return true;
  }
  override get(name: string): number {
    const [, prefix, step] =
      /^(.+?)-(xs|sm|md|lg|xl|2xl|3xl|4xl|5xl)$/.exec(name) ?? [];
    return (
      prefixOrder.indexOf(prefix ?? "") * 10 + scaleOrder.indexOf(step ?? "")
    );
  }
}

const mapping = buildMapping(new ReleaseOneSheetOrder());

describe("tailwind-semantic codemod", () => {
  describe("given semantic spacing classes", () => {
    it("maps each to the numeric step read from styles.css", () => {
      expect(mapClassString("gap-md p-lg px-sm space-y-2xl", mapping)).toBe(
        "gap-2 p-3 px-1.5 space-y-6"
      );
    });

    it("keeps variants and important markers", () => {
      expect(
        mapClassString(
          "sm:gap-lg md:hover:p-xl !mb-md group-hover/row:px-md",
          mapping
        )
      ).toBe("sm:gap-3 md:hover:p-4 !mb-2 group-hover/row:px-2");
    });
  });

  describe("given type and shadow classes", () => {
    it("maps a type class to stock size, weight and tracking", () => {
      expect(mapClassString("heading-sm", mapping)).toBe(
        "text-xl font-semibold tracking-tight"
      );
    });

    it("maps paper shadows to stock tiers, with variants", () => {
      expect(
        mapClassString("shadow-paper-sm hover:shadow-paper", mapping)
      ).toBe("shadow-xs hover:shadow-sm");
    });
  });

  describe("given two classes for the same property", () => {
    it("keeps the one Release 1 rendered", () => {
      expect(mapClassString("p-2xl p-lg", mapping)).toBe("p-6");
      expect(mapClassString("body-sm font-medium", mapping)).toBe("text-sm");
    });

    it("leaves classes alone that do not conflict", () => {
      expect(
        mapClassString("p-lg md:p-xl md:mt-4 text-muted-foreground", mapping)
      ).toBe("p-3 md:p-4 md:mt-4 text-muted-foreground");
    });
  });
});
