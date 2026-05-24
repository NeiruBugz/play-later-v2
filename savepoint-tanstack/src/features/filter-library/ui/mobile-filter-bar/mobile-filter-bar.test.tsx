import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileFilterBar } from "./mobile-filter-bar";

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
  unratedOnly: undefined,
  sortBy: "updatedAt" as const,
  sortOrder: "desc" as const,
};

const elements = {
  getOpenFiltersButton: () =>
    screen.getByRole("button", { name: "Open filters" }),
  queryDialog: () => screen.queryByRole("dialog"),
  findDialog: () => screen.findByRole("dialog"),
  getStatusFilterButton: (label: string) =>
    screen.getByRole("button", { name: `Filter by ${label}` }),
  getStatusClearButton: (label: string) =>
    screen.getByRole("button", { name: `Clear ${label} filter` }),
  getPlatformTrigger: () => screen.getByRole("combobox", { name: "Platform" }),
  getSortTrigger: () => screen.getByRole("combobox", { name: "Sort" }),
  getOption: (name: string) =>
    screen.getByRole("option", { name, hidden: true }),
  getMinRatingSlider: () =>
    screen.getByRole("slider", { name: "Minimum rating filter" }),
  getUnratedSwitch: () =>
    screen.getByRole("switch", { name: "Show only unrated games" }),
  getAcquisitionOption: (label: string) =>
    screen.getByRole("button", { name: `Filter by ${label}` }),
  getStartedSwitch: () =>
    screen.getByRole("switch", { name: "Hide untouched games" }),
  queryClearAllButton: () =>
    screen.queryByRole("button", { name: "Clear all filters" }),
  getClearAllButton: () =>
    screen.getByRole("button", { name: "Clear all filters" }),
  queryClearMinRatingButton: () =>
    screen.queryByRole("button", { name: "Clear minimum rating" }),
  getClearMinRatingButton: () =>
    screen.getByRole("button", { name: "Clear minimum rating" }),
};

const actions = {
  openSheet: () => userEvent.click(elements.getOpenFiltersButton()),
  pressEscape: () => userEvent.keyboard("{Escape}"),
  pickStatus: (label: string) =>
    userEvent.click(elements.getStatusFilterButton(label)),
  clearStatus: (label: string) =>
    userEvent.click(elements.getStatusClearButton(label)),
  openPlatformSelect: () => userEvent.click(elements.getPlatformTrigger()),
  pickPlatformOption: (name: string) =>
    userEvent.click(elements.getOption(name)),
  openSortSelect: () => userEvent.click(elements.getSortTrigger()),
  pickSortOption: (name: string) => userEvent.click(elements.getOption(name)),
  toggleUnrated: () => userEvent.click(elements.getUnratedSwitch()),
  pickAcquisition: (label: string) =>
    userEvent.click(elements.getAcquisitionOption(label)),
  toggleStarted: () => userEvent.click(elements.getStartedSwitch()),
  clearAll: () => userEvent.click(elements.getClearAllButton()),
  clearMinRating: () => userEvent.click(elements.getClearMinRatingButton()),
};

describe("MobileFilterBar", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  describe("given the component is rendered", () => {
    beforeEach(() => {
      render(<MobileFilterBar {...defaultProps} />);
    });

    it("renders the Open filters trigger without showing the dialog", () => {
      expect(elements.getOpenFiltersButton()).toBeDefined();
      expect(elements.queryDialog()).toBeNull();
    });
  });

  describe("given the user opens the filter sheet", () => {
    beforeEach(async () => {
      render(<MobileFilterBar {...defaultProps} />);
      await actions.openSheet();
    });

    it("opens the dialog", async () => {
      expect(await elements.findDialog()).toBeVisible();
    });

    it("renders all filter controls inside the sheet", async () => {
      await elements.findDialog();
      expect(elements.getStatusFilterButton("Up Next")).toBeDefined();
      expect(elements.getStatusFilterButton("Playing")).toBeDefined();
      expect(elements.getStatusFilterButton("Shelf")).toBeDefined();
      expect(elements.getStatusFilterButton("Played")).toBeDefined();
      expect(elements.getStatusFilterButton("Wishlist")).toBeDefined();
      expect(elements.getPlatformTrigger()).toBeDefined();
      expect(elements.getSortTrigger()).toBeDefined();
      expect(elements.getMinRatingSlider()).toBeDefined();
      expect(elements.getUnratedSwitch()).toBeDefined();
    });

    it("does not render the clear-all button when no filters are active", async () => {
      await elements.findDialog();
      expect(elements.queryClearAllButton()).toBeNull();
    });
  });

  describe("given the user opens then closes the sheet via Escape", () => {
    beforeEach(async () => {
      render(<MobileFilterBar {...defaultProps} />);
      await actions.openSheet();
      await elements.findDialog();
      await actions.pressEscape();
    });

    it("removes the dialog from the DOM", () => {
      expect(elements.queryDialog()).toBeNull();
    });
  });

  describe("given the user picks a status inside the sheet", () => {
    beforeEach(async () => {
      render(<MobileFilterBar {...defaultProps} />);
      await actions.openSheet();
      await elements.findDialog();
      await actions.pickStatus("Playing");
    });

    it("calls navigate with search.status set to PLAYING", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ status: "PLAYING" }),
        })
      );
    });
  });

  describe("given a status is active and the user clicks it again", () => {
    beforeEach(async () => {
      render(<MobileFilterBar {...defaultProps} status="PLAYING" />);
      await actions.openSheet();
      await elements.findDialog();
      await actions.clearStatus("Playing");
    });

    it("calls navigate with search.status undefined (toggle-deselect)", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ status: undefined }),
        })
      );
    });
  });

  describe("given the user picks a platform inside the sheet", () => {
    beforeEach(async () => {
      render(<MobileFilterBar {...defaultProps} />);
      await actions.openSheet();
      await elements.findDialog();
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

  describe("given the user changes sort to Title A–Z inside the sheet", () => {
    beforeEach(async () => {
      render(<MobileFilterBar {...defaultProps} />);
      await actions.openSheet();
      await elements.findDialog();
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

  describe("given the user toggles unrated-only on", () => {
    beforeEach(async () => {
      render(<MobileFilterBar {...defaultProps} />);
      await actions.openSheet();
      await elements.findDialog();
      await actions.toggleUnrated();
    });

    it("calls navigate with search.unratedOnly set to true", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ unratedOnly: true }),
        })
      );
    });
  });

  describe("given unratedOnly is true and the user toggles it off", () => {
    beforeEach(async () => {
      render(<MobileFilterBar {...defaultProps} unratedOnly={true} />);
      await actions.openSheet();
      await elements.findDialog();
      await actions.toggleUnrated();
    });

    it("calls navigate with search.unratedOnly undefined (toggle-off clears)", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ unratedOnly: undefined }),
        })
      );
    });
  });

  describe("given a minimum rating is set and the user clears it", () => {
    beforeEach(async () => {
      render(<MobileFilterBar {...defaultProps} minRating={3} />);
      await actions.openSheet();
      await elements.findDialog();
      await actions.clearMinRating();
    });

    it("calls navigate with search.minRating undefined", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ minRating: undefined }),
        })
      );
    });
  });

  describe("given filters are active and the user clicks Clear all filters", () => {
    beforeEach(async () => {
      render(
        <MobileFilterBar
          status="PLAYING"
          platform="PC"
          acquisition={undefined}
          startedOnly={undefined}
          minRating={7}
          unratedOnly={true}
          sortBy="title"
          sortOrder="asc"
        />
      );
      await actions.openSheet();
      await elements.findDialog();
      await actions.clearAll();
    });

    it("calls navigate clearing all filters and resetting sort to default", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({
            status: undefined,
            platform: undefined,
            minRating: undefined,
            unratedOnly: undefined,
            sortBy: "updatedAt",
            sortOrder: "desc",
          }),
        })
      );
    });
  });

  describe("given a status is active", () => {
    beforeEach(() => {
      render(<MobileFilterBar {...defaultProps} status="PLAYING" />);
    });

    it("renders the active status label inline on the trigger", () => {
      expect(elements.getOpenFiltersButton()).toHaveTextContent("Playing");
    });
  });

  describe("given the user picks an acquisition inside the sheet", () => {
    beforeEach(async () => {
      render(<MobileFilterBar {...defaultProps} />);
      await actions.openSheet();
      await elements.findDialog();
      await actions.pickAcquisition("Physical");
    });

    it("calls navigate with search.acquisition set to PHYSICAL", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ acquisition: "PHYSICAL" }),
        })
      );
    });
  });

  describe("given the user enables 'Only games I've started' in the sheet", () => {
    beforeEach(async () => {
      render(<MobileFilterBar {...defaultProps} />);
      await actions.openSheet();
      await elements.findDialog();
      await actions.toggleStarted();
    });

    it("calls navigate with search.startedOnly set to true", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ startedOnly: true }),
        })
      );
    });
  });
});
