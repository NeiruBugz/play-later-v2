import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LibraryFilters } from "./library-filters";

// --- Router mock -----------------------------------------------------------
// `useNavigate` is the only TanStack Router surface this component reaches for.
// Mocking the whole module sidesteps router-context wiring and lets the
// assertions inspect what navigation payload was produced.

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Default props
// ---------------------------------------------------------------------------

const defaultProps = {
  status: undefined,
  platform: undefined,
  minRating: undefined,
  sortBy: "updatedAt" as const,
  sortOrder: "desc" as const,
};

// ---------------------------------------------------------------------------
// Element vocabulary — Radix-aware (Select renders an internal `combobox`-role
// trigger; options are `option`-role inside a portaled listbox).
// ---------------------------------------------------------------------------

const elements = {
  // Status section
  getStatusButton: (label: string) =>
    screen.getByRole("button", { name: label }),
  queryStatusButton: (label: string) =>
    screen.queryByRole("button", { name: label }),
  // "All" pill
  getAllStatusesButton: () =>
    screen.getByRole("button", { name: "Show all statuses" }),
  // Platform Radix Select
  getPlatformTrigger: () =>
    screen.getByRole("combobox", { name: "Platform" }),
  // Sort Radix Select
  getSortTrigger: () => screen.getByRole("combobox", { name: "Sort" }),
  // Listbox option (any open Select)
  getOption: (name: string) =>
    screen.getByRole("option", { name, hidden: true }),
  // Clear-all CTA
  getClearFiltersButton: () =>
    screen.getByRole("button", { name: "Clear all filters" }),
  queryClearFiltersButton: () =>
    screen.queryByRole("button", { name: "Clear all filters" }),
  // Section labels
  queryStatusHeading: () => screen.queryByText("Status"),
  queryPlatformHeading: () => screen.queryByText("Platform"),
  querySortHeading: () => screen.queryByText("Sort"),
};

// ---------------------------------------------------------------------------
// Action vocabulary
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LibraryFilters", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  // ---- Section headers -----------------------------------------------------

  describe("given the component is rendered", () => {
    beforeEach(() => {
      render(<LibraryFilters {...defaultProps} />);
    });

    it("renders the Status section heading", () => {
      expect(elements.queryStatusHeading()).not.toBeNull();
    });

    it("renders the Platform section heading", () => {
      expect(elements.queryPlatformHeading()).not.toBeNull();
    });

    it("renders the Sort section heading", () => {
      expect(elements.querySortHeading()).not.toBeNull();
    });

    it("renders the All-statuses pill", () => {
      expect(elements.getAllStatusesButton()).toBeDefined();
    });

    it("renders a status filter control for Playing", () => {
      expect(elements.queryStatusButton("Filter by Playing")).not.toBeNull();
    });

    it("renders a status filter control for Played", () => {
      expect(elements.queryStatusButton("Filter by Played")).not.toBeNull();
    });

    it("renders a status filter control for Up Next", () => {
      expect(elements.queryStatusButton("Filter by Up Next")).not.toBeNull();
    });

    it("renders a status filter control for Shelf", () => {
      expect(elements.queryStatusButton("Filter by Shelf")).not.toBeNull();
    });

    it("renders a status filter control for Wishlist", () => {
      expect(elements.queryStatusButton("Filter by Wishlist")).not.toBeNull();
    });

    it("renders the platform Radix Select trigger", () => {
      expect(elements.getPlatformTrigger()).toBeDefined();
    });

    it("renders the sort Radix Select trigger", () => {
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

    it("renders the clear-all button when a status filter is active", () => {
      expect(elements.getClearFiltersButton()).toBeDefined();
    });

    it("marks the active status button as pressed", () => {
      expect(elements.getStatusButton("Filter by Playing")).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });

    it("does NOT mark the All pill as pressed when a status is active", () => {
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

  // ---- Status counts (count badges) ---------------------------------------

  describe("given counts are supplied", () => {
    beforeEach(() => {
      render(
        <LibraryFilters
          {...defaultProps}
          counts={{ PLAYING: 3, PLAYED: 2, UP_NEXT: 1, SHELF: 0, WISHLIST: 5 }}
        />
      );
    });

    it("renders the total count badge on the All pill", () => {
      // 3 + 2 + 1 + 0 + 5 = 11
      const allBtn = elements.getAllStatusesButton();
      expect(allBtn.textContent).toContain("11");
    });

    it("renders the per-status count next to Playing", () => {
      const playingBtn = elements.getStatusButton("Filter by Playing");
      expect(playingBtn.textContent).toContain("3");
    });

    it("renders zero counts (does not omit the cell)", () => {
      const shelfBtn = elements.getStatusButton("Filter by Shelf");
      expect(shelfBtn.textContent).toContain("0");
    });
  });

  // ---- Status filter interactions ------------------------------------------

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

    it("preserves a string sortBy in the navigation payload", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ sortBy: expect.any(String) }),
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

  // ---- Platform Radix Select interactions ---------------------------------

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

  // ---- Sort Radix Select interactions -------------------------------------

  describe("given the user changes the sort to Title A–Z", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} />);
      await actions.openSortSelect();
      await actions.pickSortOption("Title A–Z");
    });

    it("calls navigate with search.sortBy set to title", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ sortBy: "title" }),
        })
      );
    });

    it("calls navigate with search.sortOrder set to asc", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ sortOrder: "asc" }),
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

    it("calls navigate with search.sortBy set to createdAt", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ sortBy: "createdAt" }),
        })
      );
    });

    it("calls navigate with search.sortOrder set to desc", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ sortOrder: "desc" }),
        })
      );
    });
  });

  // ---- Clear all filters ---------------------------------------------------

  describe("given filters are active and the user clicks clear all", () => {
    beforeEach(async () => {
      render(
        <LibraryFilters
          status="PLAYING"
          platform="PC"
          minRating={7}
          sortBy="title"
          sortOrder="asc"
        />
      );
      await actions.clearFilters();
    });

    it("calls navigate with status, platform, and minRating all undefined", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({
            status: undefined,
            platform: undefined,
            minRating: undefined,
          }),
        })
      );
    });

    it("resets sortBy to the default (updatedAt) on clear", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ sortBy: "updatedAt" }),
        })
      );
    });

    it("resets sortOrder to the default (desc) on clear", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ sortOrder: "desc" }),
        })
      );
    });
  });

  // ---- Router is the integration boundary (not the DAL) -------------------

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
