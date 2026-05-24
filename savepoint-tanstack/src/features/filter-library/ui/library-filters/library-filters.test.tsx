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
  acquisition: undefined,
  startedOnly: undefined,
  minRating: undefined,
  sortBy: "updatedAt" as const,
  sortOrder: "desc" as const,
};

const elements = {
  getStatusButton: (label: string) =>
    screen.getByRole("button", { name: label }),
  queryStatusButton: (label: string) =>
    screen.queryByRole("button", { name: label }),
  getAllStatusesButton: () =>
    screen.getByRole("button", { name: "Show all statuses" }),
  getPlatformTrigger: () => screen.getByRole("combobox", { name: "Platform" }),
  getSortTrigger: () => screen.getByRole("combobox", { name: "Sort" }),
  getOption: (name: string) =>
    screen.getByRole("option", { name, hidden: true }),
  getAcquisitionOption: (label: string) =>
    screen.getByRole("button", { name: `Filter by ${label}` }),
  getStartedSwitch: () =>
    screen.getByRole("switch", { name: "Hide untouched games" }),
  getClearFiltersButton: () =>
    screen.getByRole("button", { name: "Clear all filters" }),
  queryClearFiltersButton: () =>
    screen.queryByRole("button", { name: "Clear all filters" }),
  queryStatusHeading: () => screen.queryByText("Status"),
  queryPlatformHeading: () => screen.queryByText("Platform"),
  querySortHeading: () => screen.queryByText("Sort"),
};

const actions = {
  selectStatus: (label: string) =>
    userEvent.click(elements.getStatusButton(label)),
  clickAll: () => userEvent.click(elements.getAllStatusesButton()),
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
    beforeEach(() => {
      render(<LibraryFilters {...defaultProps} />);
    });

    it("renders Status, Platform and Sort section headings", () => {
      expect(elements.queryStatusHeading()).not.toBeNull();
      expect(elements.queryPlatformHeading()).not.toBeNull();
      expect(elements.querySortHeading()).not.toBeNull();
    });

    it("renders all five status filter buttons and the All pill", () => {
      expect(elements.getAllStatusesButton()).toBeDefined();
      expect(elements.queryStatusButton("Filter by Playing")).not.toBeNull();
      expect(elements.queryStatusButton("Filter by Played")).not.toBeNull();
      expect(elements.queryStatusButton("Filter by Up Next")).not.toBeNull();
      expect(elements.queryStatusButton("Filter by Shelf")).not.toBeNull();
      expect(elements.queryStatusButton("Filter by Wishlist")).not.toBeNull();
    });

    it("renders the Platform and Sort select triggers", () => {
      expect(elements.getPlatformTrigger()).toBeDefined();
      expect(elements.getSortTrigger()).toBeDefined();
    });

    it("does not render the clear-all button when no filters are active", () => {
      expect(elements.queryClearFiltersButton()).toBeNull();
    });
  });

  describe("given a status filter is active", () => {
    beforeEach(() => {
      render(<LibraryFilters {...defaultProps} status="PLAYING" />);
    });

    it("shows the clear-all button and marks the active button pressed / All unpressed", () => {
      expect(elements.getClearFiltersButton()).toBeDefined();
      expect(elements.getStatusButton("Filter by Playing")).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(elements.getAllStatusesButton()).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });
  });

  describe("given no status filter is active", () => {
    beforeEach(() => {
      render(<LibraryFilters {...defaultProps} />);
    });

    it("marks the All pill as pressed", () => {
      expect(elements.getAllStatusesButton()).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });
  });

  describe("given counts are supplied", () => {
    beforeEach(() => {
      render(
        <LibraryFilters
          {...defaultProps}
          counts={{ PLAYING: 3, PLAYED: 2, UP_NEXT: 1, SHELF: 0, WISHLIST: 5 }}
        />
      );
    });

    it("renders total count on the All pill and per-status counts on each button including zero", () => {
      // 3 + 2 + 1 + 0 + 5 = 11
      expect(elements.getAllStatusesButton().textContent).toContain("11");
      expect(
        elements.getStatusButton("Filter by Playing").textContent
      ).toContain("3");
      expect(elements.getStatusButton("Filter by Shelf").textContent).toContain(
        "0"
      );
    });
  });

  describe("given the user clicks the Playing status button", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} />);
      await actions.selectStatus("Filter by Playing");
    });

    it("calls navigate with search.status set to PLAYING", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ status: "PLAYING" }),
        })
      );
    });
  });

  describe("given the user clicks the Played status button", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} />);
      await actions.selectStatus("Filter by Played");
    });

    it("calls navigate with search.status set to PLAYED", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ status: "PLAYED" }),
        })
      );
    });
  });

  describe("given status PLAYING is active and user clicks it again", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} status="PLAYING" />);
      await actions.selectStatus("Filter by Playing");
    });

    it("calls navigate with search.status undefined (toggle-deselect)", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ status: undefined }),
        })
      );
    });
  });

  describe("given the user clicks the All pill", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} status="PLAYING" />);
      await actions.clickAll();
    });

    it("calls navigate with search.status undefined", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ status: undefined }),
        })
      );
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
          acquisition={undefined}
          startedOnly={undefined}
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

  describe("given the user picks the Subscription acquisition", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} />);
      await userEvent.click(elements.getAcquisitionOption("Subscription"));
    });

    it("calls navigate with search.acquisition set to SUBSCRIPTION", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ acquisition: "SUBSCRIPTION" }),
        })
      );
    });
  });

  describe("given the user enables 'Only games I've started'", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} />);
      await userEvent.click(elements.getStartedSwitch());
    });

    it("calls navigate with search.startedOnly set to true", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ startedOnly: true }),
        })
      );
    });
  });

  describe("given any filter change is made", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} />);
      await actions.selectStatus("Filter by Shelf");
    });

    it("calls mockNavigate exactly once per interaction (router is the observed boundary)", () => {
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
  });
});
