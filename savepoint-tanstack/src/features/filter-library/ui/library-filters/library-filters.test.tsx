import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LibraryFilters } from "./library-filters";

// --- Router mock -----------------------------------------------------------
// TanStack Router typed `search` is surfaced via `useNavigate` (navigate with
// `search` updater). We mock the whole module so no router context is needed
// and assertions can inspect what navigation payload was produced.

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  // Link is not exercised by these tests; include a no-op stub so any accidental
  // import in the component under test doesn't blow up.
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
// Element vocabulary
// ---------------------------------------------------------------------------

const elements = {
  // Status filter controls
  getStatusButton: (label: string) =>
    screen.getByRole("button", { name: label }),
  queryStatusButton: (label: string) =>
    screen.queryByRole("button", { name: label }),
  getAllStatusButtons: () => screen.getAllByRole("button"),
  // Platform filter
  getPlatformSelect: () => screen.getByRole("combobox", { name: "Platform" }),
  // Rating filter
  getMinRatingSelect: () =>
    screen.getByRole("combobox", { name: "Min rating" }),
  // Sort controls
  getSortBySelect: () => screen.getByRole("combobox", { name: "Sort by" }),
  getSortOrderSelect: () =>
    screen.getByRole("combobox", { name: "Sort order" }),
  // Clear button
  getClearFiltersButton: () =>
    screen.getByRole("button", { name: "Clear all filters" }),
  queryClearFiltersButton: () =>
    screen.queryByRole("button", { name: "Clear all filters" }),
};

// ---------------------------------------------------------------------------
// Action vocabulary
// ---------------------------------------------------------------------------

const actions = {
  selectStatus: (label: string) =>
    userEvent.click(elements.getStatusButton(label)),
  selectPlatform: (value: string) =>
    userEvent.selectOptions(elements.getPlatformSelect(), value),
  selectMinRating: (value: string) =>
    userEvent.selectOptions(elements.getMinRatingSelect(), value),
  selectSortBy: (value: string) =>
    userEvent.selectOptions(elements.getSortBySelect(), value),
  selectSortOrder: (value: string) =>
    userEvent.selectOptions(elements.getSortOrderSelect(), value),
  clearFilters: () => userEvent.click(elements.getClearFiltersButton()),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LibraryFilters", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  // ---- Rendering -----------------------------------------------------------

  describe("given the component is rendered with no active filters", () => {
    beforeEach(() => {
      render(<LibraryFilters {...defaultProps} />);
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

    it("renders the platform filter", () => {
      expect(elements.getPlatformSelect()).toBeDefined();
    });

    it("renders the min rating filter", () => {
      expect(elements.getMinRatingSelect()).toBeDefined();
    });

    it("renders the sort-by control", () => {
      expect(elements.getSortBySelect()).toBeDefined();
    });

    it("renders the sort-order control", () => {
      expect(elements.getSortOrderSelect()).toBeDefined();
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

    it("does not include an undefined sortBy in the navigation payload", () => {
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

    it("calls navigate with search.status undefined (deselect / clear)", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ status: undefined }),
        })
      );
    });
  });

  // ---- Platform filter interactions ----------------------------------------

  describe("given the user selects a platform", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} />);
      await actions.selectPlatform("PC");
    });

    it("calls navigate with search.platform set to the selected value", () => {
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
      await actions.selectPlatform("All platforms");
    });

    it("calls navigate with search.platform undefined", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ platform: undefined }),
        })
      );
    });
  });

  // ---- Min rating filter interactions --------------------------------------

  describe("given the user selects a minimum rating", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} />);
      await actions.selectMinRating("7");
    });

    it("calls navigate with search.minRating set to 7", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ minRating: 7 }),
        })
      );
    });
  });

  describe("given a minRating is active and the user resets it", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} minRating={7} />);
      await actions.selectMinRating("Any rating");
    });

    it("calls navigate with search.minRating undefined", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ minRating: undefined }),
        })
      );
    });
  });

  // ---- Sort controls -------------------------------------------------------

  describe("given the user changes the sort-by field", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} />);
      await actions.selectSortBy("title");
    });

    it("calls navigate with search.sortBy set to title", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ sortBy: "title" }),
        })
      );
    });

    it("preserves the current sortOrder in the navigation payload", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ sortOrder: "desc" }),
        })
      );
    });
  });

  describe("given the user changes the sort-order", () => {
    beforeEach(async () => {
      render(<LibraryFilters {...defaultProps} />);
      await actions.selectSortOrder("asc");
    });

    it("calls navigate with search.sortOrder set to asc", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ sortOrder: "asc" }),
        })
      );
    });

    it("preserves the current sortBy in the navigation payload", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ sortBy: "updatedAt" }),
        })
      );
    });
  });

  describe("given the user changes sort-by to createdAt", () => {
    beforeEach(async () => {
      render(
        <LibraryFilters {...defaultProps} sortBy="title" sortOrder="asc" />
      );
      await actions.selectSortBy("createdAt");
    });

    it("calls navigate with search.sortBy set to createdAt", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ sortBy: "createdAt" }),
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
