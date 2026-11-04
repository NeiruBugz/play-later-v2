import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryStatusCounts } from "@/features/filter-library/lib";

import { StatusLens } from "./status-lens";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const defaultCounts: LibraryStatusCounts = {
  WANT: 12,
  PLAYING: 3,
  DONE: 47,
  UP_NEXT: 4,
};

const defaultProps = {
  status: undefined as string | undefined,
  counts: defaultCounts,
  sortBy: "updatedAt" as const,
  sortOrder: "desc" as const,
  platform: undefined as string | undefined,
  acquisition: undefined as string | undefined,
  minRating: undefined as number | undefined,
  unratedOnly: undefined as boolean | undefined,
};

const elements = {
  getLens: () => screen.getByRole("tablist", { name: "Filter by status" }),
  getAllTab: () => screen.getByRole("tab", { name: /All/ }),
  getPlayingTab: () => screen.getByRole("tab", { name: /Playing/ }),
  getDoneTab: () => screen.getByRole("tab", { name: /Done/ }),
  getWantTab: () => screen.getByRole("tab", { name: /Want/ }),
  getUpNextTab: () => screen.getByRole("tab", { name: /Up Next/ }),
};

const actions = {
  clickPlaying: () => userEvent.click(elements.getPlayingTab()),
  clickUpNext: () => userEvent.click(elements.getUpNextTab()),
  clickAll: () => userEvent.click(elements.getAllTab()),
};

describe("StatusLens", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  describe("given no status filter is active", () => {
    beforeEach(() => {
      render(<StatusLens {...defaultProps} />);
    });

    it("renders the status lens tablist", () => {
      expect(elements.getLens()).toBeDefined();
    });

    it("renders the All tab", () => {
      expect(elements.getAllTab()).toBeDefined();
    });

    it("renders the Playing tab with count", () => {
      expect(elements.getPlayingTab().textContent).toContain("3");
    });

    it("renders the Done tab with count", () => {
      expect(elements.getDoneTab().textContent).toContain("47");
    });

    it("renders the Want tab with count", () => {
      expect(elements.getWantTab().textContent).toContain("12");
    });

    it("renders the Up Next tab with its count", () => {
      expect(elements.getUpNextTab().textContent).toContain("4");
    });

    it("renders the All, Up Next, Want, Playing and Done tabs in that order, All counting only the three statuses", () => {
      expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
        "All62",
        "Up Next4",
        "Want12",
        "Playing3",
        "Done47",
      ]);
    });

    it("the All tab is selected when no status filter is active", () => {
      expect(elements.getAllTab()).toHaveAttribute("data-state", "active");
    });
  });

  describe("given the user taps the Playing tab", () => {
    beforeEach(async () => {
      render(<StatusLens {...defaultProps} />);
      await actions.clickPlaying();
    });

    it("calls navigate with status=PLAYING", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ status: "PLAYING" }),
        })
      );
    });
  });

  describe("given the user taps the Up Next tab", () => {
    beforeEach(async () => {
      render(<StatusLens {...defaultProps} />);
      await actions.clickUpNext();
    });

    it("calls navigate with status=UP_NEXT", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ status: "UP_NEXT" }),
        })
      );
    });
  });

  describe("given status=PLAYING is active and the user taps the All tab", () => {
    beforeEach(async () => {
      render(<StatusLens {...defaultProps} status="PLAYING" />);
      await actions.clickAll();
    });

    it("calls navigate with status=undefined (clears the filter)", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ status: undefined }),
        })
      );
    });
  });

  describe("given status=PLAYING is active", () => {
    beforeEach(() => {
      render(<StatusLens {...defaultProps} status="PLAYING" />);
    });

    it("the Playing tab is selected", () => {
      expect(elements.getPlayingTab()).toHaveAttribute("data-state", "active");
    });

    it("the All tab is not selected", () => {
      expect(elements.getAllTab()).toHaveAttribute("data-state", "inactive");
    });
  });

  describe("given counts are not provided", () => {
    beforeEach(() => {
      render(<StatusLens {...defaultProps} counts={undefined} />);
    });

    it("still renders the lens without crashing", () => {
      expect(elements.getLens()).toBeDefined();
    });

    it("renders the Playing tab without a count", () => {
      // Should not show 'undefined' or crash
      expect(elements.getPlayingTab()).toBeDefined();
    });
  });
});
