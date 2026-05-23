import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { GameCover } from "./game-cover";

const elements = {
  queryImg: (alt: string) => screen.queryByAltText(alt),
  getImgPlaceholder: (alt: string) => screen.getByRole("img", { name: alt }),
};

describe("GameCover", () => {
  describe("given a src URL", () => {
    beforeEach(() => {
      render(
        <GameCover
          src="https://images.igdb.com/igdb/image/upload/t_cover_big/co9wzc.jpg"
          alt="Hollow Knight"
        />
      );
    });

    it("renders an <img> with the provided src", () => {
      const img = elements.queryImg("Hollow Knight");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe(
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co9wzc.jpg"
      );
    });

    it("renders the <img> with the provided alt text", () => {
      const img = elements.queryImg("Hollow Knight");
      expect(img?.getAttribute("alt")).toBe("Hollow Knight");
    });
  });

  describe("given src is null", () => {
    beforeEach(() => {
      render(<GameCover src={null} alt="Hollow Knight" />);
    });

    it("does not render an <img>", () => {
      expect(elements.queryImg("Hollow Knight")).toBeNull();
    });

    it("renders a placeholder element with role='img' and the alt as accessible name", () => {
      expect(elements.getImgPlaceholder("Hollow Knight")).toBeDefined();
    });
  });

  describe("given a className prop", () => {
    it("applies the className to the rendered element when src is provided", () => {
      render(
        <GameCover
          src="https://images.igdb.com/igdb/image/upload/t_cover_big/co9wzc.jpg"
          alt="Hollow Knight"
          className="custom-class"
        />
      );
      const img = elements.queryImg("Hollow Knight");
      expect(img?.className).toContain("custom-class");
    });

    it("applies the className to the placeholder when src is null", () => {
      render(
        <GameCover src={null} alt="Hollow Knight" className="custom-class" />
      );
      const placeholder = elements.getImgPlaceholder("Hollow Knight");
      expect(placeholder.className).toContain("custom-class");
    });
  });
});
