import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { LibraryItemDomain } from "@/features/library/types";
import { AcquisitionType, LibraryItemStatus } from "@/shared/types/library";

import { EntryRow } from "./entry-row";

const createMockEntry = (
  overrides: Partial<LibraryItemDomain> = {}
): LibraryItemDomain => ({
  id: 1,
  userId: "user1",
  gameId: "game1",
  status: LibraryItemStatus.PLAYING,
  platform: "PC",
  acquisitionType: AcquisitionType.DIGITAL,
  createdAt: new Date("2025-01-27T12:00:00Z"),
  updatedAt: new Date("2025-01-27T12:00:00Z"),
  startedAt: null,
  completedAt: null,
  hasBeenPlayed: false,
  ...overrides,
});

const elements = {
  getButton: () => screen.getByRole("option"),
  getPlatformText: (text: string) => screen.getByText(text),
  getStatusBadge: (status: string) => screen.getByText(status),
};

const actions = {
  clickEntry: async () => {
    await userEvent.click(elements.getButton());
  },
};

describe("EntryRow", () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given entry with platform", () => {
    it("should display platform name when platform is provided", () => {
      const entry = createMockEntry({ platform: "PC" });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(elements.getPlatformText("PC")).toBeVisible();
    });

    it("should display PlayStation 5 platform", () => {
      const entry = createMockEntry({ platform: "PlayStation 5" });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(elements.getPlatformText("PlayStation 5")).toBeVisible();
    });

    it("should display Nintendo Switch platform", () => {
      const entry = createMockEntry({ platform: "Nintendo Switch" });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(elements.getPlatformText("Nintendo Switch")).toBeVisible();
    });
  });

  describe("given entry without platform", () => {
    it("should display 'No Platform' when platform is null", () => {
      const entry = createMockEntry({ platform: null });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(elements.getPlatformText("No Platform")).toBeVisible();
    });

    it("should display 'No Platform' when platform is undefined", () => {
      const entry = createMockEntry({ platform: undefined });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(elements.getPlatformText("No Platform")).toBeVisible();
    });
  });

  describe("given entry with different statuses", () => {
    it("should display status badge for Wishlist", () => {
      const entry = createMockEntry({
        status: LibraryItemStatus.WISHLIST,
      });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(elements.getStatusBadge("Wishlist")).toBeVisible();
    });

    it("should display status badge for Shelf", () => {
      const entry = createMockEntry({ status: LibraryItemStatus.SHELF });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(elements.getStatusBadge("Shelf")).toBeVisible();
    });

    it("should display status badge for Playing", () => {
      const entry = createMockEntry({ status: LibraryItemStatus.PLAYING });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(elements.getStatusBadge("Playing")).toBeVisible();
    });

    it("should display status badge for Played", () => {
      const entry = createMockEntry({ status: LibraryItemStatus.PLAYED });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(elements.getStatusBadge("Played")).toBeVisible();
    });
  });

  describe("given entry selection state", () => {
    it("should have aria-selected false when not selected", () => {
      const entry = createMockEntry();
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(elements.getButton()).toHaveAttribute("aria-selected", "false");
    });

    it("should have aria-selected true when selected", () => {
      const entry = createMockEntry();
      render(
        <EntryRow entry={entry} isSelected={true} onClick={mockOnClick} />
      );

      expect(elements.getButton()).toHaveAttribute("aria-selected", "true");
    });

    it("should apply accent border when selected", () => {
      const entry = createMockEntry();
      render(
        <EntryRow entry={entry} isSelected={true} onClick={mockOnClick} />
      );

      const button = elements.getButton();
      expect(button).toHaveClass("border-accent");
    });

    it("should apply transparent border when not selected", () => {
      const entry = createMockEntry();
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      const button = elements.getButton();
      expect(button).toHaveClass("border-transparent");
    });
  });

  describe("given user interaction", () => {
    it("should call onClick when entry is clicked", async () => {
      const entry = createMockEntry();
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      await actions.clickEntry();

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("should have button type", () => {
      const entry = createMockEntry();
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      const button = elements.getButton();
      expect(button).toHaveAttribute("type", "button");
    });

    it("should have option role for accessibility", () => {
      const entry = createMockEntry();
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(elements.getButton()).toHaveAttribute("role", "option");
    });
  });
});
