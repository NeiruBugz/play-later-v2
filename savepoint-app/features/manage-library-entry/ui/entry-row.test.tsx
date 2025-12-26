import {
  AcquisitionType,
  LibraryItemStatus,
  type LibraryItemDomain,
} from "@/data-access-layer/domain/library";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
  ...overrides,
});

const elements = {
  getButton: () => screen.getByRole("option"),
  getPlatformText: () => screen.getByText(/PC|No Platform|PlayStation 5/),
  getStatusBadge: () => screen.getByText(/Want to Play|Owned|Playing|Played/i),
  getGamepadIcon: () => screen.getByRole("option").querySelector("svg"),
  getChevronIcon: () => screen.getByRole("option").querySelectorAll("svg")[1],
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

      expect(screen.getByText("PC")).toBeVisible();
    });

    it("should display PlayStation 5 platform", () => {
      const entry = createMockEntry({ platform: "PlayStation 5" });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(screen.getByText("PlayStation 5")).toBeVisible();
    });

    it("should display Nintendo Switch platform", () => {
      const entry = createMockEntry({ platform: "Nintendo Switch" });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(screen.getByText("Nintendo Switch")).toBeVisible();
    });
  });

  describe("given entry without platform", () => {
    it("should display 'No Platform' when platform is null", () => {
      const entry = createMockEntry({ platform: null });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(screen.getByText("No Platform")).toBeVisible();
    });

    it("should display 'No Platform' when platform is undefined", () => {
      const entry = createMockEntry({ platform: undefined });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(screen.getByText("No Platform")).toBeVisible();
    });
  });

  describe("given entry with different statuses", () => {
    it("should display status badge for Want to Play", () => {
      const entry = createMockEntry({
        status: LibraryItemStatus.WANT_TO_PLAY,
      });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(screen.getByText("Want to Play")).toBeVisible();
    });

    it("should display status badge for Owned", () => {
      const entry = createMockEntry({ status: LibraryItemStatus.OWNED });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(screen.getByText("Owned")).toBeVisible();
    });

    it("should display status badge for Playing", () => {
      const entry = createMockEntry({ status: LibraryItemStatus.PLAYING });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(screen.getByText("Playing")).toBeVisible();
    });

    it("should display status badge for Played", () => {
      const entry = createMockEntry({ status: LibraryItemStatus.PLAYED });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(screen.getByText("Played")).toBeVisible();
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

  describe("layout and styling", () => {
    it("should render gamepad icon", () => {
      const entry = createMockEntry();
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(elements.getGamepadIcon()).toBeInTheDocument();
    });

    it("should render chevron icon", () => {
      const entry = createMockEntry();
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      expect(elements.getChevronIcon()).toBeInTheDocument();
    });

    it("should truncate long platform names", () => {
      const entry = createMockEntry({ platform: "PC" });
      render(
        <EntryRow entry={entry} isSelected={false} onClick={mockOnClick} />
      );

      const platformText = screen.getByText("PC");
      const container = platformText.closest("p");
      expect(container).toHaveClass("truncate");
    });
  });
});
