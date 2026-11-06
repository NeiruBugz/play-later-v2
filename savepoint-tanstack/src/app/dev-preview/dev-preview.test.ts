import { beforeEach, describe, expect, it } from "vitest";

import { applyPreview, PREVIEW_FONT_STYLESHEETS } from "./dev-preview";

describe("applyPreview", () => {
  let root: HTMLElement;
  let head: HTMLElement;

  beforeEach(() => {
    root = document.createElement("html");
    head = document.createElement("head");
  });

  describe("given an accent option in the query", () => {
    beforeEach(() => applyPreview("?preview=accent-b", root, head));

    it("marks the root with that accent", () => {
      expect(root.dataset.previewAccent).toBe("b");
    });

    it("leaves the font untouched", () => {
      expect(root.dataset.previewFont).toBeUndefined();
      expect(head.querySelectorAll("link")).toHaveLength(0);
    });
  });

  describe("given a font option in the query", () => {
    beforeEach(() => applyPreview("?font=c", root, head));

    it("marks the root with that font", () => {
      expect(root.dataset.previewFont).toBe("c");
    });

    it("loads exactly that font's stylesheet with display swap", () => {
      const links = head.querySelectorAll("link");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute("href", PREVIEW_FONT_STYLESHEETS.c);
      expect(links[0].href).toContain("display=swap");
    });
  });

  describe("given both options", () => {
    beforeEach(() => applyPreview("?preview=accent-c&font=a", root, head));

    it("applies both", () => {
      expect(root.dataset.previewAccent).toBe("c");
      expect(root.dataset.previewFont).toBe("a");
    });
  });

  describe.each(["", "?other=1", "?preview=accent-z&font=x", "?preview=b"])(
    "given the query %j",
    (search) => {
      beforeEach(() => applyPreview(search, root, head));

      it("changes nothing", () => {
        expect(root.dataset.previewAccent).toBeUndefined();
        expect(root.dataset.previewFont).toBeUndefined();
        expect(head.querySelectorAll("link")).toHaveLength(0);
      });
    }
  );

  it("keeps every font option to at most two weights", () => {
    for (const href of Object.values(PREVIEW_FONT_STYLESHEETS)) {
      const weights = /wght@([\d;]+)/.exec(href)?.[1].split(";") ?? ["400"];
      expect(weights.length).toBeLessThanOrEqual(2);
    }
  });
});
