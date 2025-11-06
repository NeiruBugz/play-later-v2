import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuickActionButtons } from "./quick-action-buttons";

// Mock the server action
vi.mock("../server-actions", () => ({
  updateLibraryStatusAction: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("QuickActionButtons - Accessibility", () => {
  const defaultProps = {
    igdbId: 1234,
    gameTitle: "Test Game",
    currentStatus: undefined,
  };

  describe("Keyboard Navigation", () => {
    it("should be fully keyboard navigable with Tab key", async () => {
      const user = userEvent.setup();
      render(<QuickActionButtons {...defaultProps} />);

      // Get all buttons
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(6); // 6 status buttons

      // Tab through all buttons
      await user.tab();
      expect(buttons[0]).toHaveFocus();

      await user.tab();
      expect(buttons[1]).toHaveFocus();

      await user.tab();
      expect(buttons[2]).toHaveFocus();
    });

    it("should be activatable with Enter key", async () => {
      const user = userEvent.setup();
      render(<QuickActionButtons {...defaultProps} />);

      const curiousButton = screen.getByRole("button", {
        name: "Mark as Curious About",
      });

      curiousButton.focus();
      await user.keyboard("{Enter}");

      // Verify button was activated (becomes pressed)
      await waitFor(() => {
        expect(curiousButton).toHaveAttribute("aria-pressed", "true");
      });
    });

    it("should be activatable with Space key", async () => {
      const user = userEvent.setup();
      render(<QuickActionButtons {...defaultProps} />);

      const playingButton = screen.getByRole("button", {
        name: "Mark as Currently Exploring",
      });

      playingButton.focus();
      await user.keyboard(" ");

      // Verify button was activated
      await waitFor(() => {
        expect(playingButton).toHaveAttribute("aria-pressed", "true");
      });
    });
  });

  describe("ARIA Attributes", () => {
    it("should have proper aria-label for each button", () => {
      render(<QuickActionButtons {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: "Mark as Curious About" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Mark as Currently Exploring" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Mark as Taking a Break" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Mark as Experienced" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Add to Wishlist" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Mark as Revisiting" })
      ).toBeInTheDocument();
    });

    it("should have aria-pressed attribute reflecting current state", () => {
      render(
        <QuickActionButtons {...defaultProps} currentStatus="CURIOUS_ABOUT" />
      );

      const curiousButton = screen.getByRole("button", {
        name: "Mark as Curious About",
      });
      expect(curiousButton).toHaveAttribute("aria-pressed", "true");

      const otherButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn !== curiousButton);
      otherButtons.forEach((btn) => {
        expect(btn).toHaveAttribute("aria-pressed", "false");
      });
    });

    it("should have aria-hidden on icons", () => {
      const { container } = render(<QuickActionButtons {...defaultProps} />);

      const icons = container.querySelectorAll("svg");
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute("aria-hidden", "true");
      });
    });

    it("should have role=group for button container", () => {
      render(<QuickActionButtons {...defaultProps} />);

      const group = screen.getByRole("group", {
        name: "Journey status quick actions",
      });
      expect(group).toBeInTheDocument();
    });
  });

  describe("Screen Reader Announcements", () => {
    it("should have aria-live region for status updates", () => {
      render(<QuickActionButtons {...defaultProps} />);

      const liveRegion = screen.getByRole("status");
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
      expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    });

    it("should announce status changes to screen readers", async () => {
      const user = userEvent.setup();
      render(<QuickActionButtons {...defaultProps} />);

      const curiousButton = screen.getByRole("button", {
        name: "Mark as Curious About",
      });

      await user.click(curiousButton);

      await waitFor(() => {
        const liveRegion = screen.getByRole("status");
        expect(liveRegion).toHaveTextContent("Status updated to Curious");
      });
    });
  });

  describe("Focus Management", () => {
    it("should have visible focus indicators", () => {
      render(<QuickActionButtons {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        // Check for focus-visible classes
        expect(button.className).toContain("focus-visible:ring-2");
        expect(button.className).toContain("focus-visible:ring-primary");
        expect(button.className).toContain("focus-visible:ring-offset-2");
      });
    });

    it("should not lose focus after status update", async () => {
      const user = userEvent.setup();
      render(<QuickActionButtons {...defaultProps} />);

      const curiousButton = screen.getByRole("button", {
        name: "Mark as Curious About",
      });

      curiousButton.focus();
      expect(curiousButton).toHaveFocus();

      await user.click(curiousButton);

      await waitFor(() => {
        expect(curiousButton).toHaveFocus();
      });
    });
  });

  describe("Disabled State", () => {
    it("should disable all buttons when pending", async () => {
      const { updateLibraryStatusAction } = await import("../server-actions");
      vi.mocked(updateLibraryStatusAction).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, data: {} as any }), 1000);
          })
      );

      const user = userEvent.setup();
      render(<QuickActionButtons {...defaultProps} />);

      const curiousButton = screen.getByRole("button", {
        name: "Mark as Curious About",
      });

      await user.click(curiousButton);

      // All buttons should be disabled while pending
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });
});
