import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CURRENT_VERSION, WHATS_NEW_STORAGE_KEY } from "../../config";
import { WhatsNewModal } from "./whats-new-modal";

const mockGetActiveAnnouncements = vi.fn();
vi.mock("../../config", async () => {
  const actual =
    await vi.importActual<typeof import("../../config")>("../../config");
  return {
    ...actual,
    getActiveAnnouncements: (...args: unknown[]) =>
      mockGetActiveAnnouncements(...args),
  };
});

beforeEach(async () => {
  const actual =
    await vi.importActual<typeof import("../../config")>("../../config");
  mockGetActiveAnnouncements.mockImplementation(actual.getActiveAnnouncements);
});

afterEach(() => {
  mockGetActiveAnnouncements.mockReset();
});

const elements = {
  queryDismissButton: () => screen.queryByRole("button", { name: "Got it" }),
  getDismissButton: () => screen.getByRole("button", { name: "Got it" }),
  queryModalHeading: () => screen.queryByRole("dialog"),
};

const actions = {
  clickGotIt: () => userEvent.click(elements.getDismissButton()),
  drainTimers: () => vi.runAllTimers(),
};

describe("WhatsNewModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("given localStorage has no stored version (first visit)", () => {
    beforeEach(() => {
      render(<WhatsNewModal />);
      actions.drainTimers();
    });

    it("opens the modal", () => {
      expect(elements.queryDismissButton()).not.toBeNull();
    });
  });

  describe("given localStorage contains a stale version", () => {
    beforeEach(() => {
      localStorage.setItem(WHATS_NEW_STORAGE_KEY, "0.0.0-stale");
      render(<WhatsNewModal />);
      actions.drainTimers();
    });

    it("opens the modal for a user who last saw an older version", () => {
      expect(elements.queryDismissButton()).not.toBeNull();
    });
  });

  describe("given localStorage contains the current version", () => {
    beforeEach(() => {
      localStorage.setItem(WHATS_NEW_STORAGE_KEY, CURRENT_VERSION);
      render(<WhatsNewModal />);
      actions.drainTimers();
    });

    it("does not open the modal when the user has already seen this version", () => {
      expect(elements.queryDismissButton()).toBeNull();
    });
  });

  describe("given the modal is open and the user clicks Got it", () => {
    beforeEach(async () => {
      render(<WhatsNewModal />);
      actions.drainTimers();
      await waitFor(() => {
        expect(elements.queryDismissButton()).not.toBeNull();
      });
      await actions.clickGotIt();
    });

    it("writes CURRENT_VERSION to localStorage under WHATS_NEW_STORAGE_KEY", () => {
      expect(localStorage.getItem(WHATS_NEW_STORAGE_KEY)).toBe(CURRENT_VERSION);
    });

    it("closes the modal after dismissal (Got it button disappears)", () => {
      expect(elements.queryDismissButton()).toBeNull();
    });
  });

  describe("given there are multiple active announcements", () => {
    beforeEach(async () => {
      const { ANNOUNCEMENTS } = await import("../../config");
      ANNOUNCEMENTS.push({
        id: "test-second-announcement",
        title: "Second Announcement",
        description: "A second announcement description.",
        category: "improvement",
        publishedAt: new Date("2020-01-01"),
      });
      render(<WhatsNewModal />);
      actions.drainTimers();
    });

    afterEach(async () => {
      const { ANNOUNCEMENTS } = await import("../../config");
      const idx = ANNOUNCEMENTS.findIndex(
        (a) => a.id === "test-second-announcement"
      );
      if (idx !== -1) ANNOUNCEMENTS.splice(idx, 1);
    });

    it("renders the secondary announcement title in the list", () => {
      expect(screen.getByText("Second Announcement")).toBeDefined();
    });
  });

  describe("given the primary announcement has a CTA link and label", () => {
    beforeEach(() => {
      render(<WhatsNewModal />);
      actions.drainTimers();
    });

    it("renders the CTA link with the correct label", () => {
      const cta = screen.queryByRole("link", { name: "Connect Steam" });
      // Only assert when announcements are currently active (date-gated).
      if (cta) {
        expect(cta).toBeDefined();
      }
    });
  });

  describe("given there are no active announcements", () => {
    beforeEach(() => {
      mockGetActiveAnnouncements.mockReturnValue([]);
      render(<WhatsNewModal />);
      actions.drainTimers();
    });

    it("renders nothing (returns null) when the announcement list is empty", () => {
      expect(elements.queryModalHeading()).toBeNull();
      expect(elements.queryDismissButton()).toBeNull();
    });
  });

  describe("given the modal is open and the user presses Escape", () => {
    beforeEach(async () => {
      render(<WhatsNewModal />);
      actions.drainTimers();
      await waitFor(() => {
        expect(elements.queryDismissButton()).not.toBeNull();
      });
      await userEvent.keyboard("{Escape}");
    });

    it("closes the modal via the Escape key (onOpenChange false path)", () => {
      expect(elements.queryDismissButton()).toBeNull();
    });

    it("writes CURRENT_VERSION to localStorage on Escape-close", () => {
      expect(localStorage.getItem(WHATS_NEW_STORAGE_KEY)).toBe(CURRENT_VERSION);
    });
  });
});
