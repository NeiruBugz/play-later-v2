import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LibraryFilters } from "./library-filters";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const defaultProps = {
  status: undefined,
  platform: undefined,
  minRating: undefined,
  sortBy: "updatedAt" as const,
  sortOrder: "desc" as const,
};

const elements = {
  queryStatusButton: (label: string) =>
    screen.queryByRole("button", { name: label }),
  getPlatformTrigger: () => screen.getByRole("combobox", { name: "Platform" }),
  getSortTrigger: () => screen.getByRole("combobox", { name: "Sort" }),
  getOption: (name: string) =>
    screen.getByRole("option", { name, hidden: true }),
  getNotOwnedOnlySwitch: () =>
    screen.getByRole("switch", { name: "Not owned only" }),
  queryNotOwnedOnlySwitch: () =>
    screen.queryByRole("switch", { name: "Not owned only" }),
  queryAcquisitionHeading: () => screen.queryByText("Acquisition"),
  getClearFiltersButton: () =>
    screen.getByRole("button", { name: "Clear all filters" }),
  queryClearFiltersButton: () =>
    screen.queryByRole("button", { name: "Clear all filters" }),
  queryStatusHeading: () => screen.queryByText("Status"),
  queryPlatformHeading: () => screen.queryByText("Platform"),
  querySortHeading: () => screen.queryByText("Sort"),
};

const actions = {
  openPlatformSelect: async () =>
    userEvent.click(elements.getPlatformTrigger()),
  pickPlatformOption: async (name: string) =>
    userEvent.click(elements.getOption(name)),
  openSortSelect: async () => userEvent.click(elements.getSortTrigger()),
  pickSortOption: async (name: string) =>
    userEvent.click(elements.getOption(name)),
  clearFilters: () => userEvent.click(elements.getClearFiltersButton()),
};

describe("LibraryFilters", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  describe("given the component is rendered", () => {
    it("has no status filter of its own (the chips above the grid are the only one)", () => {
      expect(elements.queryStatusHeading()).toBeNull();
      expect(elements.queryStatusButton("Filter by Want")).toBeNull();
      expect(elements.queryStatusButton("Filter by Playing")).toBeNull();
      expect(elements.queryStatusButton("Filter by Done")).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Show all statuses" })
      ).toBeNull();
    });

    beforeEach(() => {
      render(<LibraryFilters {...defaultProps} />);
    });

    it("renders Platform and Sort section headings", () => {
      expect(elements.queryPlatformHeading()).not.toBeNull();
      expect(elements.querySortHeading()).not.toBeNull();
    });

    it("renders the Platform and Sort select triggers", () => {
      expect(elements.getPlatformTrigger()).toBeDefined();
      expect(elements.getSortTrigger()).toBeDefined();
    });

    it("does not render the clear-all button when no filters are active", () => {
      expect(elements.queryClearFiltersButton()).toBeNull();
    });
  });

  describe("given the user opens the platform select and picks PC", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} />);
      await actions.openPlatformSelect();
      await actions.pickPlatformOption("PC");
    });

    it("calls navigate with search.platform set to PC", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ platform: "PC" }),
        })
      );
    });
  });

  describe("given the user resets the platform filter to all", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} platform="PC" />);
      await actions.openPlatformSelect();
      await actions.pickPlatformOption("All platforms");
    });

    it("calls navigate with search.platform undefined", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ platform: undefined }),
        })
      );
    });
  });

  describe("given the user changes the sort to Title A–Z", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} />);
      await actions.openSortSelect();
      await actions.pickSortOption("Title A–Z");
    });

    it("calls navigate with sortBy=title and sortOrder=asc", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({
            sortBy: "title",
            sortOrder: "asc",
          }),
        })
      );
    });
  });

  describe("given the user changes the sort to Recently Added", () => {
    beforeEach(async () => {
      render(
        <LibraryFilters {...defaultProps} sortBy="title" sortOrder="asc" />
      );
      await actions.openSortSelect();
      await actions.pickSortOption("Recently Added");
    });

    it("calls navigate with sortBy=createdAt and sortOrder=desc", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({
            sortBy: "createdAt",
            sortOrder: "desc",
          }),
        })
      );
    });
  });

  describe("given filters are active and the user clicks clear all", () => {
    beforeEach(async () => {
      render(
        <LibraryFilters
          status="PLAYING"
          platform="PC"
          minRating={3.5}
          sortBy="title"
          sortOrder="asc"
        />
      );
      await actions.clearFilters();
    });

    it("calls navigate clearing all filters and resetting sort to default", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({
            status: undefined,
            platform: undefined,
            minRating: undefined,
            sortBy: "updatedAt",
            sortOrder: "desc",
          }),
        })
      );
    });
  });

  describe("given the sidebar is rendered without a status", () => {
    it("has no Acquisition filter", () => {
      render(<LibraryFilters {...defaultProps} />);
      expect(elements.queryAcquisitionHeading()).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Filter by Physical" })
      ).toBeNull();
    });

    it("offers no Not owned only toggle", () => {
      render(<LibraryFilters {...defaultProps} />);
      expect(elements.queryNotOwnedOnlySwitch()).toBeNull();
    });
  });

  describe("given the Want filter is selected", () => {
    it("offers the Not owned only toggle, which sets notOwnedOnly", async () => {
      render(<LibraryFilters {...defaultProps} status="WANT" />);
      await userEvent.click(elements.getNotOwnedOnlySwitch());
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({
            status: "WANT",
            notOwnedOnly: true,
          }),
        })
      );
    });
  });

  describe("given the desktop filters are rendered", () => {
    beforeEach(() => {
      render(<LibraryFilters {...defaultProps} />);
    });

    it("offers Minimum rating and Unrated only like the phone sheet", () => {
      expect(
        screen.getByRole("slider", { name: "Minimum rating filter" })
      ).toBeDefined();
      expect(
        screen.getByRole("switch", { name: "Show only unrated games" })
      ).toBeDefined();
    });
  });

  describe("given the user toggles Unrated only", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} />);
      await userEvent.click(
        screen.getByRole("switch", { name: "Show only unrated games" })
      );
    });

    it("navigates with unratedOnly true, the same param the phone writes", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ unratedOnly: true }),
        })
      );
    });
  });

  describe("given the user picks a minimum rating", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} />);
      await userEvent.click(screen.getByTestId("rating-star-4"));
    });

    it("navigates with minRating in stars, the same param the phone writes", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ minRating: 4 }),
        })
      );
    });
  });

  describe("given a minimum rating is active", () => {
    beforeEach(() => {
      render(<LibraryFilters {...defaultProps} minRating={3} />);
    });

    it("offers Clear all filters", () => {
      expect(elements.getClearFiltersButton()).toBeDefined();
    });
  });
});
