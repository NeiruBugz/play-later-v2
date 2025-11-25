import { renderWithTestProviders } from "@/test/utils/test-provider";
import { platformApiResponseFixture } from "@fixtures/platform";
import { AcquisitionType, LibraryItemStatus } from "@/data-access-layer/domain/library";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { addToLibraryAction } from "../../server-actions";
import { AddEntryForm } from "./add-entry-form";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../server-actions", () => ({
  addToLibraryAction: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockAddToLibraryAction = vi.mocked(addToLibraryAction);

const elements = {
  getStatusTrigger: () =>
    screen.getByRole("combobox", { name: /journey status/i }),
  getPlatformTrigger: () => screen.getByRole("combobox", { name: /platform/i }),
  getStartedAtInput: () => screen.getByLabelText(/started at/i),
  getCompletedAtInput: () => screen.getByLabelText(/completed at/i),
  getCancelButton: () => screen.getByRole("button", { name: /cancel/i }),
  getSubmitButton: () =>
    screen.getByRole("button", { name: /add to library|add entry/i }),
  getEditModeInfo: () => screen.queryByText(/Add another library entry for/i),
  getFormDescription: () =>
    screen.getByText("Select your current journey status with this game"),
  getStartedAtDescription: () =>
    screen.queryByText(/when did you start playing/i),
  getCompletedAtDescription: () => screen.queryByText(/when did you finish/i),
};

const actions = {
  selectStatus: async (statusLabel: string) => {
    await userEvent.click(elements.getStatusTrigger());

    const statusOptions = screen.getAllByText(statusLabel);
    await userEvent.click(statusOptions[statusOptions.length - 1]);
  },

  selectPlatform: async (platformName: string) => {
    await waitFor(
      () => {
        expect(elements.getPlatformTrigger()).toBeEnabled();
      },
      { timeout: 3000 }
    );
    await userEvent.click(elements.getPlatformTrigger());

    await waitFor(
      () => {
        const options = screen.queryAllByRole("option");
        expect(options.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    const platformOption = screen.getByRole("option", { name: platformName });
    await userEvent.click(platformOption);
  },

  typeStartedAtDate: async (dateString: string) => {
    const input = elements.getStartedAtInput();
    await userEvent.clear(input);
    await userEvent.type(input, dateString);
  },

  typeCompletedAtDate: async (dateString: string) => {
    const input = elements.getCompletedAtInput();
    await userEvent.clear(input);
    await userEvent.type(input, dateString);
  },

  clearStartedAtDate: async () => {
    const input = elements.getStartedAtInput();
    await userEvent.clear(input);
  },

  clearCompletedAtDate: async () => {
    const input = elements.getCompletedAtInput();
    await userEvent.clear(input);
  },

  clickCancel: async () => {
    await userEvent.click(elements.getCancelButton());
  },

  clickSubmit: async () => {
    await userEvent.click(elements.getSubmitButton());
  },

  selectStatusAndSubmit: async (statusLabel: string, platformName = "PC") => {
    await actions.selectStatus(statusLabel);
    await actions.selectPlatform(platformName);
    await actions.clickSubmit();
  },
};

describe("AddEntryForm", () => {
  const defaultProps = {
    igdbId: 12345,
    gameId: "game1",
    gameTitle: "The Legend of Zelda: Breath of the Wild",
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddToLibraryAction.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        userId: "user1",
        gameId: "game1",
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: null,
        acquisitionType: AcquisitionType.DIGITAL,
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        completedAt: null,
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => platformApiResponseFixture,
    });
  });

  describe("given form just rendered in add mode", () => {
    it("should display all required form fields", async () => {
      renderWithTestProviders(<AddEntryForm {...defaultProps} />);

      await waitFor(() => {
        expect(elements.getStatusTrigger()).toBeVisible();
        expect(elements.getPlatformTrigger()).toBeVisible();
        expect(elements.getStartedAtInput()).toBeVisible();
        expect(elements.getCompletedAtInput()).toBeVisible();
        expect(elements.getCancelButton()).toBeVisible();
        expect(elements.getSubmitButton()).toBeVisible();
        expect(elements.getFormDescription()).toBeVisible();
        expect(elements.getEditModeInfo()).not.toBeInTheDocument();
      });
    });

    it("should display correct button text in add mode", async () => {
      renderWithTestProviders(<AddEntryForm {...defaultProps} />);

      await waitFor(() => {
        expect(elements.getSubmitButton()).toHaveTextContent("Add to Library");
      });
    });
  });

  describe("given form rendered in edit mode", () => {
    it("should display edit mode UI with correct button text and info message", async () => {
      renderWithTestProviders(<AddEntryForm {...defaultProps} isEditMode />);

      await waitFor(() => {
        expect(elements.getSubmitButton()).toHaveTextContent("Add Entry");
        expect(elements.getEditModeInfo()).toBeVisible();
        expect(
          screen.getByText(/The Legend of Zelda: Breath of the Wild/)
        ).toBeVisible();
        expect(
          screen.getByText(/own the game on multiple platforms/)
        ).toBeVisible();
      });
    });
  });

  describe("given user cancels form", () => {
    it("should call onCancel callback", async () => {
      const onCancel = vi.fn();
      renderWithTestProviders(
        <AddEntryForm {...defaultProps} onCancel={onCancel} />
      );

      await actions.clickCancel();

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("given date field interactions", () => {
    it("should allow user to input and clear dates", async () => {
      renderWithTestProviders(<AddEntryForm {...defaultProps} />);

      expect(elements.getStartedAtInput()).toHaveValue("");
      expect(elements.getCompletedAtInput()).toHaveValue("");

      await actions.typeStartedAtDate("2025-01-15");
      await actions.typeCompletedAtDate("2025-02-20");

      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("2025-01-15");
        expect(elements.getCompletedAtInput()).toHaveValue("2025-02-20");
      });

      await actions.clearStartedAtDate();

      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("");
        expect(elements.getCompletedAtInput()).toHaveValue("2025-02-20");
      });
    });

    it("should maintain date values when interacting with other form fields", async () => {
      renderWithTestProviders(<AddEntryForm {...defaultProps} />);

      await actions.typeStartedAtDate("2025-01-15");
      await actions.typeCompletedAtDate("2025-02-20");
      await userEvent.click(elements.getStatusTrigger());

      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("2025-01-15");
        expect(elements.getCompletedAtInput()).toHaveValue("2025-02-20");
      });
    });
  });
});
