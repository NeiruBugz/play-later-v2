import type { ImportedGame } from "@prisma/client";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LibraryItemStatus } from "@/shared/types";

import { ImportGameModal } from "./import-game-modal";

vi.mock("@/shared/lib/date", () => ({
  formatRelativeDate: vi.fn((date: Date) => {
    const now = new Date("2026-01-20T12:00:00Z");
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }),
}));

vi.mock("@/shared/lib/library-status", () => ({
  getStatusConfig: vi.fn((status: LibraryItemStatus) => {
    const statusMap = {
      [LibraryItemStatus.WANT_TO_PLAY]: { label: "Want to Play" },
      [LibraryItemStatus.OWNED]: { label: "Owned" },
      [LibraryItemStatus.PLAYING]: { label: "Playing" },
      [LibraryItemStatus.PLAYED]: { label: "Played" },
    };
    return statusMap[status];
  }),
}));

const mockImportMutate = vi.fn();
let mockIsPending = false;

vi.mock("../hooks/use-import-game", () => ({
  useImportGame: () => ({
    mutate: mockImportMutate,
    get isPending() {
      return mockIsPending;
    },
  }),
}));

const createMockImportedGame = (
  overrides: Partial<ImportedGame> = {}
): ImportedGame => ({
  id: "game-1",
  userId: "user-1",
  storefront: "STEAM",
  storefrontGameId: "440",
  name: "Team Fortress 2",
  playtime: 1250,
  playtimeWindows: 1000,
  playtimeMac: 150,
  playtimeLinux: 100,
  lastPlayedAt: new Date("2026-01-15T12:00:00Z"),
  img_icon_url: "abc123def456",
  img_logo_url: null,
  igdbMatchStatus: "PENDING",
  createdAt: new Date("2026-01-18T10:00:00Z"),
  updatedAt: new Date("2026-01-18T10:00:00Z"),
  deletedAt: null,
  ...overrides,
});

const elements = {
  getDialog: () => screen.getByRole("dialog"),
  queryDialog: () => screen.queryByRole("dialog"),
  getDialogTitle: () =>
    screen.getByRole("heading", { name: /import game to library/i }),
  getGameName: (name: string) => screen.getByText(name),
  getPlaytimeLabel: () => screen.getByText("Playtime:"),
  getLastPlayedLabel: () => screen.getByText("Last Played:"),
  getStatusLabel: () => screen.getByText("Library Status"),
  getSmartDefaultText: (status: string) =>
    screen.getByText(`Smart default: ${status}`),
  getStatusSelect: () => screen.getByRole("combobox"),
  getStatusSelectByLabel: () => screen.getByLabelText("Library Status"),
  getCancelButton: () => screen.getByRole("button", { name: /cancel/i }),
  getImportButton: () => screen.getByRole("button", { name: /import/i }),
  getLoadingSpinner: () => screen.queryByRole("img", { hidden: true }),
  getFormattedPlaytime: (time: string) => screen.getByText(time),
  getLastPlayedValue: (text: string) => screen.getByText(text),
  getSelectedStatusText: (status: string) => screen.getByText(status),
  findStatusOption: (name: RegExp) => screen.findByRole("option", { name }),
};

const actions = {
  openStatusDropdown: async () => {
    const user = userEvent.setup();
    await user.click(elements.getStatusSelect());
  },
  selectStatus: async (statusName: RegExp) => {
    const user = userEvent.setup();
    await user.click(elements.getStatusSelect());
    const option = await elements.findStatusOption(statusName);
    await user.click(option);
  },
  clickImport: async () => {
    const user = userEvent.setup();
    await user.click(elements.getImportButton());
  },
  clickCancel: async () => {
    const user = userEvent.setup();
    await user.click(elements.getCancelButton());
  },
};

describe("ImportGameModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.setSystemTime(new Date("2026-01-20T12:00:00Z"));
    mockImportMutate.mockClear();
    mockOnClose.mockClear();
    mockIsPending = false;
  });

  describe("modal visibility", () => {
    it("should render dialog when isOpen is true", () => {
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getDialog()).toBeVisible();
    });

    it("should not render dialog when isOpen is false", () => {
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={false} onClose={mockOnClose} game={game} />
      );

      expect(elements.queryDialog()).not.toBeInTheDocument();
    });
  });

  describe("game information display", () => {
    it("should display game name in dialog description", () => {
      const game = createMockImportedGame({ name: "The Witcher 3" });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getGameName("The Witcher 3")).toBeVisible();
    });

    it("should truncate long game names", () => {
      const game = createMockImportedGame({
        name: "A Very Long Game Name That Should Be Truncated Eventually",
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      const description = elements.getGameName(
        "A Very Long Game Name That Should Be Truncated Eventually"
      );
      expect(description).toHaveClass("truncate");
    });

    it("should display dialog title", () => {
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getDialogTitle()).toBeVisible();
    });
  });

  describe("playtime formatting", () => {
    it("should format playtime in hours when >= 60 minutes", () => {
      const game = createMockImportedGame({ playtime: 750 });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getFormattedPlaytime("12.5 hrs")).toBeVisible();
    });

    it("should format playtime in minutes when < 60 minutes", () => {
      const game = createMockImportedGame({ playtime: 45 });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getFormattedPlaytime("45 min")).toBeVisible();
    });

    it("should display 'Never played' when playtime is 0", () => {
      const game = createMockImportedGame({ playtime: 0 });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getFormattedPlaytime("Never played")).toBeVisible();
    });

    it("should display 'Never played' when playtime is null", () => {
      const game = createMockImportedGame({ playtime: null });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getFormattedPlaytime("Never played")).toBeVisible();
    });

    it("should display playtime label", () => {
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getPlaytimeLabel()).toBeVisible();
    });
  });

  describe("last played date formatting", () => {
    it("should format recent date relatively (5 days ago)", () => {
      const fiveDaysAgo = new Date("2026-01-15T12:00:00Z");
      const game = createMockImportedGame({ lastPlayedAt: fiveDaysAgo });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getLastPlayedValue("5 days ago")).toBeVisible();
    });

    it("should format recent date relatively (today)", () => {
      const today = new Date("2026-01-20T10:00:00Z");
      const game = createMockImportedGame({ lastPlayedAt: today });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getLastPlayedValue("today")).toBeVisible();
    });

    it("should format recent date relatively (yesterday)", () => {
      const yesterday = new Date("2026-01-19T12:00:00Z");
      const game = createMockImportedGame({ lastPlayedAt: yesterday });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getLastPlayedValue("yesterday")).toBeVisible();
    });

    it("should display 'Never' when lastPlayedAt is null", () => {
      const game = createMockImportedGame({ lastPlayedAt: null });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getLastPlayedValue("Never")).toBeVisible();
    });

    it("should display last played label", () => {
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getLastPlayedLabel()).toBeVisible();
    });
  });

  describe("smart status default", () => {
    it("should default to OWNED status for games with 0 playtime", () => {
      const game = createMockImportedGame({
        playtime: 0,
        lastPlayedAt: null,
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getSmartDefaultText("Owned")).toBeVisible();
      expect(elements.getSelectedStatusText("Owned")).toBeVisible();
    });

    it("should default to OWNED status for games with null playtime", () => {
      const game = createMockImportedGame({
        playtime: null,
        lastPlayedAt: null,
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getSmartDefaultText("Owned")).toBeVisible();
    });

    it("should default to PLAYING status for games played within last 7 days", () => {
      const threeDaysAgo = new Date("2026-01-17T12:00:00Z");
      const game = createMockImportedGame({
        playtime: 100,
        lastPlayedAt: threeDaysAgo,
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getSmartDefaultText("Playing")).toBeVisible();
      expect(elements.getSelectedStatusText("Playing")).toBeVisible();
    });

    it("should default to PLAYING status for game played today", () => {
      const today = new Date("2026-01-20T10:00:00Z");
      const game = createMockImportedGame({
        playtime: 250,
        lastPlayedAt: today,
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getSmartDefaultText("Playing")).toBeVisible();
    });

    it("should default to PLAYED status for games played exactly 7 days ago (boundary test)", () => {
      const exactlySevenDaysAgo = new Date("2026-01-13T12:00:00Z");
      const game = createMockImportedGame({
        playtime: 600,
        lastPlayedAt: exactlySevenDaysAgo,
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getSmartDefaultText("Played")).toBeVisible();
      expect(elements.getSelectedStatusText("Played")).toBeVisible();
    });

    it("should default to PLAYED status for games played more than 7 days ago", () => {
      const tenDaysAgo = new Date("2026-01-10T12:00:00Z");
      const game = createMockImportedGame({
        playtime: 1500,
        lastPlayedAt: tenDaysAgo,
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getSmartDefaultText("Played")).toBeVisible();
    });

    it("should default to PLAYED status for games with playtime but no lastPlayedAt date", () => {
      const game = createMockImportedGame({
        playtime: 500,
        lastPlayedAt: null,
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getSmartDefaultText("Played")).toBeVisible();
    });
  });

  describe("status selection", () => {
    it("should render status select dropdown", () => {
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getStatusSelect()).toBeVisible();
      expect(elements.getStatusLabel()).toBeVisible();
    });

    it("should allow user to change status to Want to Play", async () => {
      const game = createMockImportedGame({
        playtime: 100,
        lastPlayedAt: new Date("2026-01-19T12:00:00Z"),
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      await actions.selectStatus(/want to play/i);

      expect(elements.getSelectedStatusText("Want to Play")).toBeVisible();
    });

    it("should allow user to change status to Owned", async () => {
      const game = createMockImportedGame({
        playtime: 100,
        lastPlayedAt: new Date("2026-01-19T12:00:00Z"),
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      await actions.selectStatus(/^owned$/i);

      expect(elements.getSelectedStatusText("Owned")).toBeVisible();
    });

    it("should allow user to change status to Played", async () => {
      const game = createMockImportedGame({
        playtime: 100,
        lastPlayedAt: new Date("2026-01-19T12:00:00Z"),
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      await actions.selectStatus(/played/i);

      expect(elements.getSelectedStatusText("Played")).toBeVisible();
    });

    it("should allow user to change status multiple times", async () => {
      const game = createMockImportedGame({
        playtime: 0,
        lastPlayedAt: null,
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getSelectedStatusText("Owned")).toBeVisible();

      await actions.selectStatus(/playing/i);
      expect(elements.getSelectedStatusText("Playing")).toBeVisible();

      await actions.selectStatus(/played/i);
      expect(elements.getSelectedStatusText("Played")).toBeVisible();
    });
  });

  describe("import button", () => {
    it("should render import button", () => {
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getImportButton()).toBeVisible();
    });

    it("should call import mutation with correct parameters when clicked", async () => {
      const game = createMockImportedGame({
        id: "test-game-123",
        playtime: 0,
        lastPlayedAt: null,
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      await actions.clickImport();

      expect(mockImportMutate).toHaveBeenCalledTimes(1);
      expect(mockImportMutate).toHaveBeenCalledWith(
        {
          importedGameId: "test-game-123",
          status: "owned",
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      );
    });

    it("should map PLAYING status to 'playing' when importing", async () => {
      const game = createMockImportedGame({
        id: "game-123",
        playtime: 100,
        lastPlayedAt: new Date("2026-01-19T12:00:00Z"),
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      await actions.clickImport();

      expect(mockImportMutate).toHaveBeenCalledWith(
        {
          importedGameId: "game-123",
          status: "playing",
        },
        expect.any(Object)
      );
    });

    it("should map OWNED status to 'owned' when importing", async () => {
      const game = createMockImportedGame({
        id: "game-456",
        playtime: 0,
        lastPlayedAt: null,
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      await actions.clickImport();

      expect(mockImportMutate).toHaveBeenCalledWith(
        {
          importedGameId: "game-456",
          status: "owned",
        },
        expect.any(Object)
      );
    });

    it("should map PLAYED status to 'played' when importing", async () => {
      const game = createMockImportedGame({
        id: "game-789",
        playtime: 1000,
        lastPlayedAt: new Date("2026-01-10T12:00:00Z"),
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      await actions.clickImport();

      expect(mockImportMutate).toHaveBeenCalledWith(
        {
          importedGameId: "game-789",
          status: "played",
        },
        expect.any(Object)
      );
    });

    it("should map WANT_TO_PLAY status to 'want_to_play' when importing", async () => {
      const game = createMockImportedGame({
        id: "game-999",
        playtime: 100,
        lastPlayedAt: new Date("2026-01-19T12:00:00Z"),
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      await actions.selectStatus(/want to play/i);

      await actions.clickImport();

      expect(mockImportMutate).toHaveBeenCalledWith(
        {
          importedGameId: "game-999",
          status: "want_to_play",
        },
        expect.any(Object)
      );
    });
  });

  describe("loading state", () => {
    it("should show button with loading prop when mutation is pending", () => {
      mockIsPending = true;
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      const importButton = elements.getImportButton();
      expect(importButton).toBeDisabled();
      expect(importButton).toHaveTextContent("Import");
    });

    it("should disable import button when mutation is pending", () => {
      mockIsPending = true;
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getImportButton()).toBeDisabled();
    });

    it("should disable cancel button when mutation is pending", () => {
      mockIsPending = true;
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getCancelButton()).toBeDisabled();
    });

    it("should not show button as loading when mutation is not pending", () => {
      mockIsPending = false;
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      const importButton = elements.getImportButton();
      expect(importButton).toBeEnabled();
    });

    it("should enable buttons when mutation is not pending", () => {
      mockIsPending = false;
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getImportButton()).toBeEnabled();
      expect(elements.getCancelButton()).toBeEnabled();
    });
  });

  describe("success handling", () => {
    it("should close modal on successful import", async () => {
      const game = createMockImportedGame();

      mockImportMutate.mockImplementation((params, { onSuccess }) => {
        onSuccess();
      });

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      await actions.clickImport();

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("cancel button", () => {
    it("should render cancel button", () => {
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getCancelButton()).toBeVisible();
    });

    it("should call onClose when cancel button is clicked", async () => {
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      await actions.clickCancel();

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should have secondary variant", () => {
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      const cancelButton = elements.getCancelButton();
      expect(cancelButton).toHaveClass("bg-secondary");
    });
  });

  describe("accessibility", () => {
    it("should have dialog role", () => {
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getDialog()).toHaveAttribute("role", "dialog");
    });

    it("should have accessible heading", () => {
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      const heading = elements.getDialogTitle();
      expect(heading).toBeVisible();
      expect(heading.tagName).toBe("H2");
    });

    it("should have label for status select", () => {
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      const select = elements.getStatusSelect();
      expect(select).toHaveAttribute("id", "status-select");

      const label = elements.getStatusSelectByLabel();
      expect(label).toBeVisible();
    });

    it("should have descriptive button text", () => {
      const game = createMockImportedGame();

      render(
        <ImportGameModal isOpen={true} onClose={mockOnClose} game={game} />
      );

      expect(elements.getImportButton()).toHaveTextContent("Import");
      expect(elements.getCancelButton()).toHaveTextContent("Cancel");
    });
  });
});
