import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import type { RelatedGame } from "../../api";
import { RelatedGamesTabs } from "./related-games-tabs";
import type { RelatedGamesTabsSection } from "./related-games-tabs.type";

function makeGames(count: number): RelatedGame[] {
  return Array.from({ length: count }, (_, index) => ({
    igdbId: index + 1,
    slug: `game-${index + 1}`,
    title: `Game ${index + 1}`,
    coverImageId: null,
  }));
}

function makeSection(
  collectionId: number,
  collectionName: string,
  gameCount = 0
): RelatedGamesTabsSection {
  return { collectionId, collectionName, games: makeGames(gameCount) };
}

const SECTION_A = makeSection(1, "Mario series", 8);
const SECTION_B = makeSection(2, "Platformers", 3);

const elements = {
  getTab: (name: string) => screen.getByRole("tab", { name }),
  queryTab: (name: string) => screen.queryByRole("tab", { name }),
  getActiveTabPanel: () => screen.getByRole("tabpanel", { hidden: false }),
  getVisibleToggle: () => screen.getByRole("button", { name: "Show all (8)" }),
  getGamesIn: (tabName: string) =>
    within(screen.getByRole("tabpanel", { name: tabName, hidden: true }))
      .queryAllByRole("listitem", { hidden: true })
      .map((item) => item.textContent),
};

const actions = {
  switchToTab: (name: string) => userEvent.click(elements.getTab(name)),
};

describe("RelatedGamesTabs", () => {
  describe("given a long franchise breadcrumb", () => {
    beforeEach(() => {
      render(
        <RelatedGamesTabs
          sections={[
            makeSection(1, "Final Fantasy VII Compilation of Remakes"),
            makeSection(2, "Final Fantasy Main Series Collection"),
            makeSection(3, "Square Enix Role-Playing Franchise Universe"),
          ]}
          renderGame={(game) => <span>{game.title}</span>}
        />
      );
    });

    it("keeps the tab row inside its container and scrolls it there, never the page", () => {
      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveClass("max-w-full", "overflow-x-auto");
    });
  });

  describe("given no sections", () => {
    beforeEach(() => {
      render(
        <RelatedGamesTabs
          sections={[]}
          renderGame={(game) => <span>{game.title}</span>}
        />
      );
    });

    it("renders nothing", () => {
      expect(screen.queryByRole("tablist")).toBeNull();
    });
  });

  describe("given two sections", () => {
    beforeEach(() => {
      render(
        <RelatedGamesTabs
          sections={[SECTION_A, SECTION_B]}
          renderGame={(game) => <span>{game.title}</span>}
        />
      );
    });

    it("renders one tab per collection labelled with the collection name", () => {
      expect(elements.getTab("Mario series")).toBeDefined();
      expect(elements.getTab("Platformers")).toBeDefined();
    });

    it("activates the first section's tab and shows its list as the visible panel", () => {
      expect(elements.getTab("Mario series")).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(elements.getTab("Platformers")).toHaveAttribute(
        "aria-selected",
        "false"
      );
    });

    it("shows the first six games of the first collection with a toggle", () => {
      expect(elements.getGamesIn("Mario series")).toHaveLength(6);
      expect(elements.getVisibleToggle()).toBeDefined();
    });

    it("keeps the second collection's list mounted", () => {
      expect(elements.getGamesIn("Platformers")).toHaveLength(3);
    });
  });

  describe("given the user switches to the second tab", () => {
    beforeEach(async () => {
      render(
        <RelatedGamesTabs
          sections={[SECTION_A, SECTION_B]}
          renderGame={(game) => <span>{game.title}</span>}
        />
      );
      await actions.switchToTab("Platformers");
    });

    it("marks the second tab as selected", () => {
      expect(elements.getTab("Platformers")).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(elements.getTab("Mario series")).toHaveAttribute(
        "aria-selected",
        "false"
      );
    });
  });

  describe("given the user expands the first tab, leaves it and comes back", () => {
    beforeEach(async () => {
      render(
        <RelatedGamesTabs
          sections={[SECTION_A, SECTION_B]}
          renderGame={(game) => <span>{game.title}</span>}
        />
      );
      await userEvent.click(elements.getVisibleToggle());
      await actions.switchToTab("Platformers");
      await actions.switchToTab("Mario series");
    });

    it("still shows every game of that collection", () => {
      expect(elements.getGamesIn("Mario series")).toHaveLength(8);
    });
  });

  describe("given a single section", () => {
    beforeEach(() => {
      render(
        <RelatedGamesTabs
          sections={[SECTION_A]}
          renderGame={(game) => <span>{game.title}</span>}
        />
      );
    });

    it("still renders the tablist with one tab", () => {
      expect(elements.getTab("Mario series")).toBeDefined();
    });
  });
});
