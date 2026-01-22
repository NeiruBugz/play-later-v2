import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { LibraryItemStatus } from "@/shared/types";

import { addToLibraryAction } from "../server-actions";
import { EntryForm } from "./entry-form";

vi.mock("@/shared/hooks/game", () => ({
  useGetPlatforms: vi.fn(() => ({
    data: {
      supportedPlatforms: [
        { id: 1, name: "PlayStation 5" },
        { id: 2, name: "PC" },
      ],
      otherPlatforms: [{ id: 3, name: "Xbox Series X" }],
    },
    isLoading: false,
    error: null,
  })),
}));

vi.mock("../server-actions", () => ({
  addToLibraryAction: vi.fn(),
  updateLibraryEntryAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const elements = {
  getPlatformCombobox: () =>
    screen.getByRole("combobox", { name: /platform/i }),
  getPlatformLabel: () => screen.getByText("Platform (Optional)"),
  getPlatformDescription: () =>
    screen.getByText("Select the platform you'll play on (optional)"),
  getStatusButtons: () => screen.getAllByRole("button"),
  getStatusRadio: (label: string) =>
    screen.getByRole("radio", { name: new RegExp(label, "i") }),
  findPlatformOption: (name: string) => screen.findByRole("option", { name }),
  getSubmitButton: () => {
    const buttons = screen.getAllByRole("button");
    return (
      buttons.find((btn) => (btn as HTMLButtonElement).type === "submit") ||
      buttons[buttons.length - 1]
    );
  },
  getCancelButton: () => screen.queryByRole("button", { name: /cancel/i }),
};

const actions = {
  clickSubmit: async () => {
    await userEvent.click(elements.getSubmitButton());
  },
  selectStatus: async (statusLabel: string) => {
    const statusButton = elements.getStatusRadio(statusLabel);
    await userEvent.click(statusButton);
  },
  selectPlatform: async (platformName: string) => {
    await userEvent.click(elements.getPlatformCombobox());
    const option = await elements.findPlatformOption(platformName);
    await userEvent.click(option);
  },
};

function renderEntryForm(props: Partial<Parameters<typeof EntryForm>[0]> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const defaultProps = {
    igdbId: 12345,
    gameTitle: "Test Game",
    entry: null,
    isAddMode: true,
    existingPlatforms: [],
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
    ...props,
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <EntryForm {...defaultProps} />
    </QueryClientProvider>
  );
}

describe("EntryForm - AddForm variant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given component is rendered in add mode", () => {
    it("should display platform field with '(Optional)' label", () => {
      renderEntryForm();

      expect(elements.getPlatformLabel()).toBeVisible();
      expect(elements.getPlatformCombobox()).toBeVisible();
    });

    it("should have no platform pre-selected by default", () => {
      renderEntryForm();

      const combobox = elements.getPlatformCombobox();
      expect(combobox).toHaveTextContent("Select platform");
    });

    it("should show platform description indicating it is optional", () => {
      renderEntryForm();

      expect(elements.getPlatformDescription()).toBeVisible();
    });
  });

  describe("given user submits form without selecting platform", () => {
    it("should successfully submit the form", async () => {
      const mockOnSuccess = vi.fn();
      const mockActionResult = {
        success: true as const,
        data: {
          id: 1,
          userId: "user-123",
          gameId: "game-123",
          status: LibraryItemStatus.WANT_TO_PLAY,
          platform: null,
          acquisitionType: null,
          startedAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.mocked(addToLibraryAction).mockResolvedValue(mockActionResult);

      renderEntryForm({ onSuccess: mockOnSuccess });

      await actions.clickSubmit();

      await waitFor(() => {
        expect(addToLibraryAction).toHaveBeenCalled();
      });

      const callArgs = vi.mocked(addToLibraryAction).mock.calls[0][0];
      expect(callArgs).toMatchObject({
        igdbId: 12345,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });
      expect(callArgs.platform).toBe("");
    });

    it("should call onSuccess callback after successful submission", async () => {
      const mockOnSuccess = vi.fn();
      const mockActionResult = {
        success: true as const,
        data: {
          id: 1,
          userId: "user-123",
          gameId: "game-123",
          status: LibraryItemStatus.WANT_TO_PLAY,
          platform: null,
          acquisitionType: null,
          startedAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.mocked(addToLibraryAction).mockResolvedValue(mockActionResult);

      renderEntryForm({ onSuccess: mockOnSuccess });

      await actions.clickSubmit();

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("given user submits form with platform selected", () => {
    it("should submit form with selected platform", async () => {
      const mockActionResult = {
        success: true as const,
        data: {
          id: 1,
          userId: "user-123",
          gameId: "game-123",
          status: LibraryItemStatus.WANT_TO_PLAY,
          platform: "PlayStation 5",
          acquisitionType: null,
          startedAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.mocked(addToLibraryAction).mockResolvedValue(mockActionResult);

      renderEntryForm();

      await actions.selectPlatform("PlayStation 5");
      await actions.clickSubmit();

      await waitFor(() => {
        expect(addToLibraryAction).toHaveBeenCalled();
      });

      const callArgs = vi.mocked(addToLibraryAction).mock.calls[0][0];
      expect(callArgs).toMatchObject({
        igdbId: 12345,
        status: LibraryItemStatus.WANT_TO_PLAY,
        platform: "PlayStation 5",
      });
    });
  });

  describe("given user interacts with form controls", () => {
    it("should allow changing status and submitting without platform", async () => {
      const mockActionResult = {
        success: true as const,
        data: {
          id: 1,
          userId: "user-123",
          gameId: "game-123",
          status: LibraryItemStatus.PLAYING,
          platform: null,
          acquisitionType: null,
          startedAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.mocked(addToLibraryAction).mockResolvedValue(mockActionResult);

      renderEntryForm();

      await actions.selectStatus("Playing");
      await actions.clickSubmit();

      await waitFor(() => {
        expect(addToLibraryAction).toHaveBeenCalled();
      });

      const callArgs = vi.mocked(addToLibraryAction).mock.calls[0][0];
      expect(callArgs).toMatchObject({
        igdbId: 12345,
        status: LibraryItemStatus.PLAYING,
      });
      expect(callArgs.platform).toBe("");
    });

    it("should show 'Add to Library' text when no existing platforms", () => {
      renderEntryForm({ existingPlatforms: [] });
      expect(elements.getSubmitButton()).toHaveTextContent("Add to Library");
    });

    it("should show 'Add Entry' text when existing platforms present", () => {
      renderEntryForm({ existingPlatforms: ["PC"] });
      expect(elements.getSubmitButton()).toHaveTextContent("Add Entry");
    });
  });
});
