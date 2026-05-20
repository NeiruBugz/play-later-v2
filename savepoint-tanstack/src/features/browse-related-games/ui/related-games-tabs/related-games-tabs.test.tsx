import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RelatedGamesTabs } from "./related-games-tabs";
import type { RelatedGamesTabsSection } from "./related-games-tabs.type";

vi.mock("../related-games-infinite-list", () => ({
  RelatedGamesInfiniteList: ({ collectionId }: { collectionId: number }) => (
    <div data-testid={`infinite-list-${collectionId}`}>
      list for {collectionId}
    </div>
  ),
}));

function makeSection(
  collectionId: number,
  collectionName: string
): RelatedGamesTabsSection {
  return {
    collectionId,
    collectionName,
    pageSize: 6,
    firstPage: {
      games: [],
      total: 0,
      page: 1,
      pageSize: 6,
      hasMore: false,
    },
  };
}

const SECTION_A = makeSection(1, "Mario series");
const SECTION_B = makeSection(2, "Platformers");

const elements = {
  getTab: (name: string) => screen.getByRole("tab", { name }),
  queryTab: (name: string) => screen.queryByRole("tab", { name }),
  getActiveTabPanel: () => screen.getByRole("tabpanel", { hidden: false }),
  getList: (collectionId: number) =>
    screen.getByTestId(`infinite-list-${collectionId}`),
  queryList: (collectionId: number) =>
    screen.queryByTestId(`infinite-list-${collectionId}`),
};

const actions = {
  switchToTab: (name: string) => userEvent.click(elements.getTab(name)),
};

describe("RelatedGamesTabs", () => {
  describe("given no sections", () => {
    beforeEach(() => {
      render(<RelatedGamesTabs sections={[]} />);
    });

    it("renders nothing", () => {
      expect(screen.queryByRole("tablist")).toBeNull();
    });
  });

  describe("given two sections", () => {
    beforeEach(() => {
      render(<RelatedGamesTabs sections={[SECTION_A, SECTION_B]} />);
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
      expect(elements.getList(SECTION_A.collectionId)).toBeDefined();
    });

    it("keeps both lists mounted so inactive tab state survives a tab switch", () => {
      // forceMount keeps inactive panels in the DOM (just hidden) — this is
      // the mechanism that lets the active-tab IntersectionObserver fire
      // while inactive panels pause their fetching.
      expect(elements.queryList(SECTION_A.collectionId)).not.toBeNull();
      expect(elements.queryList(SECTION_B.collectionId)).not.toBeNull();
    });
  });

  describe("given the user switches to the second tab", () => {
    beforeEach(async () => {
      render(<RelatedGamesTabs sections={[SECTION_A, SECTION_B]} />);
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

  describe("given a single section", () => {
    beforeEach(() => {
      render(<RelatedGamesTabs sections={[SECTION_A]} />);
    });

    it("still renders the tablist with one tab", () => {
      expect(elements.getTab("Mario series")).toBeDefined();
      expect(elements.getList(SECTION_A.collectionId)).toBeDefined();
    });
  });
});
