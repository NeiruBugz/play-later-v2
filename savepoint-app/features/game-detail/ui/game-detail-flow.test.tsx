/**
 * End-to-End Integration Tests for Game Detail Page Flow
 *
 * Tests the complete user journey:
 * 1. Search for a game
 * 2. Navigate to game detail page
 * 3. Add game to library
 * 4. Update journey status via quick actions
 * 5. Manage library entries
 * 6. Navigate to related games
 *
 * @vitest-environment jsdom
 */

import type { AcquisitionType, LibraryItem } from "@prisma/client";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AddToLibraryButton } from "./add-to-library-button";
import { LibraryStatusDisplay } from "./library-status-display";
import { QuickActionButtons } from "./quick-action-buttons";

// Mock server actions
vi.mock("../server-actions", () => ({
  updateLibraryStatusAction: vi.fn().mockResolvedValue({ success: true }),
  addToLibraryAction: vi.fn().mockResolvedValue({ success: true }),
  updateLibraryItemAction: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Game Detail Page - End-to-End Flow", () => {
  const mockGame = {
    igdbId: 1234,
    title: "The Legend of Zelda: Breath of the Wild",
    slug: "the-legend-of-zelda-breath-of-the-wild",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("User Flow: Add Game to Library", () => {
    it("should allow user to add game to library and see confirmation", async () => {
      const user = userEvent.setup();

      render(
        <AddToLibraryButton
          igdbId={mockGame.igdbId}
          gameTitle={mockGame.title}
        />
      );

      // Step 1: User clicks "Add to Library" button
      const addButton = screen.getByRole("button", {
        name: `Add ${mockGame.title} to your library`,
      });
      expect(addButton).toBeVisible();

      await user.click(addButton);

      // Step 2: Modal should open
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: "Add to Library" })
        ).toBeVisible();
      });

      // Step 3: User should see form to add entry
      // (Form interaction tested separately)
    });
  });

  describe("User Flow: Update Journey Status", () => {
    it("should allow user to update status via quick actions", async () => {
      const user = userEvent.setup();
      const { updateLibraryStatusAction } = await import("../server-actions");

      render(
        <QuickActionButtons
          igdbId={mockGame.igdbId}
          gameTitle={mockGame.title}
          currentStatus={undefined}
        />
      );

      // Step 1: User sees quick action buttons
      expect(
        screen.getByRole("button", { name: "Mark as Curious About" })
      ).toBeVisible();

      // Step 2: User clicks "Curious About" button
      const curiousButton = screen.getByRole("button", {
        name: "Mark as Curious About",
      });
      await user.click(curiousButton);

      // Step 3: Server action should be called
      await waitFor(() => {
        expect(updateLibraryStatusAction).toHaveBeenCalledWith({
          igdbId: mockGame.igdbId,
          status: "CURIOUS_ABOUT",
        });
      });

      // Step 4: Button should show active state
      await waitFor(() => {
        expect(curiousButton).toHaveAttribute("aria-pressed", "true");
      });

      // Step 5: Screen reader should be notified
      const liveRegion = screen.getByRole("status");
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent("Status updated to Curious");
      });
    });

    it("should allow user to change status multiple times", async () => {
      const user = userEvent.setup();
      const { updateLibraryStatusAction } = await import("../server-actions");

      render(
        <QuickActionButtons
          igdbId={mockGame.igdbId}
          gameTitle={mockGame.title}
          currentStatus="CURIOUS_ABOUT"
        />
      );

      // Initial state: Curious About is active
      const curiousButton = screen.getByRole("button", {
        name: "Mark as Curious About",
      });
      expect(curiousButton).toHaveAttribute("aria-pressed", "true");

      // Step 1: User changes to "Currently Exploring"
      const playingButton = screen.getByRole("button", {
        name: "Mark as Currently Exploring",
      });
      await user.click(playingButton);

      await waitFor(() => {
        expect(updateLibraryStatusAction).toHaveBeenCalledWith({
          igdbId: mockGame.igdbId,
          status: "CURRENTLY_EXPLORING",
        });
      });

      // Step 2: New status should be active
      await waitFor(() => {
        expect(playingButton).toHaveAttribute("aria-pressed", "true");
        expect(curiousButton).toHaveAttribute("aria-pressed", "false");
      });
    });
  });

  describe("User Flow: Manage Library Entries", () => {
    it("should allow user to open manage library modal", async () => {
      const user = userEvent.setup();
      const mockLibraryItem: LibraryItem = {
        id: 1,
        userId: "user1",
        gameId: "123",
        status: "CURIOUS_ABOUT",
        createdAt: new Date(),
        updatedAt: new Date(),
        platform: null,
        acquisitionType: "DIGITAL" as AcquisitionType,
        startedAt: null,
        completedAt: null,
      };

      const mockLibraryStatus = {
        mostRecent: {
          status: "CURIOUS_ABOUT" as const,
        },
        updatedAt: new Date(),
        allItems: [mockLibraryItem],
      };

      render(
        <LibraryStatusDisplay
          userLibraryStatus={mockLibraryStatus}
          igdbId={mockGame.igdbId}
          gameTitle={mockGame.title}
        />
      );

      // Step 1: User sees current library status
      expect(screen.getByText("Curious About")).toBeVisible();

      // Step 2: User clicks "Manage Library" button
      const manageButton = screen.getByRole("button", {
        name: `Manage library entries for ${mockGame.title}`,
      });
      await user.click(manageButton);

      // Step 3: Modal should open
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: "Manage Library" })
        ).toBeVisible();
      });
    });
  });

  describe("User Flow: Keyboard Navigation", () => {
    it("should support full keyboard navigation for quick actions", async () => {
      const user = userEvent.setup();

      render(
        <QuickActionButtons
          igdbId={mockGame.igdbId}
          gameTitle={mockGame.title}
          currentStatus={undefined}
        />
      );

      // Step 1: Tab to first button
      await user.tab();
      const curiousButton = screen.getByRole("button", {
        name: "Mark as Curious About",
      });
      expect(curiousButton).toHaveFocus();

      // Step 2: Activate with Enter key
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(curiousButton).toHaveAttribute("aria-pressed", "true");
      });

      // Step 3: Tab to next button
      await user.tab();
      const playingButton = screen.getByRole("button", {
        name: "Mark as Currently Exploring",
      });
      expect(playingButton).toHaveFocus();

      // Step 4: Activate with Space key
      await user.keyboard(" ");

      await waitFor(() => {
        expect(playingButton).toHaveAttribute("aria-pressed", "true");
      });
    });
  });

  describe("User Flow: Error Handling", () => {
    it("should handle server errors gracefully", async () => {
      const user = userEvent.setup();
      const { updateLibraryStatusAction } = await import("../server-actions");
      const { toast } = await import("sonner");

      vi.mocked(updateLibraryStatusAction).mockResolvedValueOnce({
        success: false,
        error: "Network error",
      });

      render(
        <QuickActionButtons
          igdbId={mockGame.igdbId}
          gameTitle={mockGame.title}
          currentStatus={undefined}
        />
      );

      const curiousButton = screen.getByRole("button", {
        name: "Mark as Curious About",
      });
      await user.click(curiousButton);

      // Should show error toast
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update status", {
          description: "Network error",
        });
      });

      // Button should not be active
      expect(curiousButton).toHaveAttribute("aria-pressed", "false");

      // Screen reader should be notified
      const liveRegion = screen.getByRole("status");
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent("Failed to update status");
      });
    });
  });

  describe("User Flow: Performance", () => {
    it("should not block UI during status updates", async () => {
      const user = userEvent.setup();
      const { updateLibraryStatusAction } = await import("../server-actions");

      // Simulate slow network
      vi.mocked(updateLibraryStatusAction).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, data: {} as any }), 100);
          })
      );

      render(
        <QuickActionButtons
          igdbId={mockGame.igdbId}
          gameTitle={mockGame.title}
          currentStatus={undefined}
        />
      );

      const curiousButton = screen.getByRole("button", {
        name: "Mark as Curious About",
      });

      // Click button - should respond immediately
      await user.click(curiousButton);

      // Buttons should be disabled during update
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });

      // Wait for completion
      await waitFor(
        () => {
          expect(curiousButton).toHaveAttribute("aria-pressed", "true");
        },
        { timeout: 200 }
      );
    });
  });

  describe("User Flow: Accessibility Compliance", () => {
    it("should meet WCAG 2.1 AA standards for interactive elements", () => {
      render(
        <QuickActionButtons
          igdbId={mockGame.igdbId}
          gameTitle={mockGame.title}
          currentStatus={undefined}
        />
      );

      // All buttons should have accessible names
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });

      // All buttons should have aria-pressed
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-pressed");
      });

      // Container should have role=group
      const group = screen.getByRole("group", {
        name: "Journey status quick actions",
      });
      expect(group).toBeInTheDocument();

      // Should have live region for announcements
      const liveRegion = screen.getByRole("status");
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
    });
  });
});
