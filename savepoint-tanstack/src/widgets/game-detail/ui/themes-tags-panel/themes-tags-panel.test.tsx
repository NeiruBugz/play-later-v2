import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ThemesTagsPanel } from "./themes-tags-panel";

const elements = {
  queryThemesLabel: () => screen.queryByText("// THEMES"),
  queryGenresLabel: () => screen.queryByText("// GENRES"),
  queryPlatformsLabel: () => screen.queryByText("// PLATFORMS"),
  queryThemesList: () => screen.queryByLabelText("Themes"),
  queryGenresList: () => screen.queryByLabelText("Genres"),
  queryPlatformsList: () => screen.queryByLabelText("Platforms"),
};

describe("ThemesTagsPanel", () => {
  describe("given themes, genres, and platforms", () => {
    beforeEach(() => {
      render(
        <ThemesTagsPanel
          themes={["Action", "Fantasy"]}
          genres={["Role-playing (RPG)", "Adventure"]}
          platforms={["PC (Microsoft Windows)", "PlayStation 5"]}
        />
      );
    });

    it("renders each theme as a chip next to the THEMES label", () => {
      expect(elements.queryThemesLabel()).not.toBeNull();
      const list = elements.queryThemesList();
      expect(list).not.toBeNull();
      const items = within(list!).getAllByRole("listitem");
      expect(items.map((i) => i.textContent)).toEqual(["Action", "Fantasy"]);
    });

    it("renders each genre as a chip next to the GENRES label", () => {
      expect(elements.queryGenresLabel()).not.toBeNull();
      const list = elements.queryGenresList();
      expect(list).not.toBeNull();
      const items = within(list!).getAllByRole("listitem");
      expect(items.map((i) => i.textContent)).toEqual([
        "Role-playing (RPG)",
        "Adventure",
      ]);
    });

    it("renders the platforms via PlatformBadges with their abbreviations", () => {
      expect(elements.queryPlatformsLabel()).not.toBeNull();
      const list = elements.queryPlatformsList();
      expect(list).not.toBeNull();
      expect(within(list!).getByText("PC")).toBeDefined();
      expect(within(list!).getByText("PS5")).toBeDefined();
    });
  });

  describe("given no themes", () => {
    beforeEach(() => {
      render(
        <ThemesTagsPanel
          themes={[]}
          genres={["Adventure"]}
          platforms={["PC (Microsoft Windows)"]}
        />
      );
    });

    it("omits the THEMES row", () => {
      expect(elements.queryThemesLabel()).toBeNull();
      expect(elements.queryThemesList()).toBeNull();
    });

    it("still renders genres and platforms", () => {
      expect(elements.queryGenresLabel()).not.toBeNull();
      expect(elements.queryPlatformsLabel()).not.toBeNull();
    });
  });

  describe("given no genres", () => {
    beforeEach(() => {
      render(
        <ThemesTagsPanel
          themes={["Action"]}
          genres={[]}
          platforms={["PC (Microsoft Windows)"]}
        />
      );
    });

    it("omits the GENRES row", () => {
      expect(elements.queryGenresLabel()).toBeNull();
      expect(elements.queryGenresList()).toBeNull();
    });
  });

  describe("given no platforms", () => {
    beforeEach(() => {
      render(
        <ThemesTagsPanel
          themes={["Action"]}
          genres={["Adventure"]}
          platforms={[]}
        />
      );
    });

    it("omits the PLATFORMS row", () => {
      expect(elements.queryPlatformsLabel()).toBeNull();
      expect(elements.queryPlatformsList()).toBeNull();
    });
  });
});
