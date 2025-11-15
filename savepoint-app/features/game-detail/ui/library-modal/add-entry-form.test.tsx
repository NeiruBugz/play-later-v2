import { LibraryItemStatus } from "@prisma/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

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

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockAddToLibraryAction = vi.mocked(addToLibraryAction);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

// Helper to create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

// Helper to render component with QueryClient wrapper
const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

const elements = {
  getStatusTrigger: () =>
    screen.getByRole("combobox", { name: /journey status/i }),
  getPlatformTrigger: () => screen.getByRole("combobox", { name: /platform/i }),
  getCancelButton: () => screen.getByRole("button", { name: /cancel/i }),
  getSubmitButton: () =>
    screen.getByRole("button", { name: /add to library|add entry/i }),
  getEditModeInfo: () => screen.queryByText(/Add another library entry for/i),
  getFormDescription: () =>
    screen.getByText("Select your current journey status with this game"),
};

const actions = {
  selectStatus: async (statusLabel: string) => {
    await userEvent.click(elements.getStatusTrigger());
    await userEvent.click(screen.getByText(statusLabel));
  },

  selectPlatform: async (platformName: string) => {
    // Wait for platforms to load
    await waitFor(() => {
      expect(elements.getPlatformTrigger()).toBeEnabled();
    });
    await userEvent.click(elements.getPlatformTrigger());
    // Wait for the command menu to appear
    await waitFor(() => {
      const options = screen.queryAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
    });
    // Find and click the platform option
    const platformOption = screen.getByRole("option", { name: platformName });
    await userEvent.click(platformOption);
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
        acquisitionType: "DIGITAL",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        completedAt: null,
      },
    });

    // Mock fetch for platforms API
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          supportedPlatforms: [
            {
              id: "1",
              igdbId: 167,
              name: "PlayStation 5",
              slug: "ps5",
              abbreviation: "PS5",
              alternativeName: null,
              generation: 9,
              platformFamily: null,
              platformType: null,
              checksum: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          otherPlatforms: [
            {
              id: "2",
              igdbId: 6,
              name: "PC",
              slug: "pc",
              abbreviation: "PC",
              alternativeName: null,
              generation: null,
              platformFamily: null,
              platformType: null,
              checksum: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      }),
    });
  });

  describe("given form just rendered in add mode", () => {
    it("should display status selector", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await waitFor(() => {
        expect(elements.getStatusTrigger()).toBeInTheDocument();
      });
    });

    it("should display form description", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await waitFor(() => {
        expect(elements.getFormDescription()).toBeInTheDocument();
      });
    });

    it("should display cancel button", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await waitFor(() => {
        expect(elements.getCancelButton()).toBeInTheDocument();
      });
    });

    it("should display 'Add to Library' submit button", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await waitFor(() => {
        expect(elements.getSubmitButton()).toHaveTextContent("Add to Library");
      });
    });

    it("should not display edit mode info message", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await waitFor(() => {
        expect(elements.getEditModeInfo()).not.toBeInTheDocument();
      });
    });
  });

  describe("given form rendered in edit mode", () => {
    it("should display 'Add Entry' submit button", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} isEditMode />);

      await waitFor(() => {
        expect(elements.getSubmitButton()).toHaveTextContent("Add Entry");
      });
    });

    it("should display edit mode info message with game title", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} isEditMode />);

      await waitFor(() => {
        expect(elements.getEditModeInfo()).toBeInTheDocument();
        expect(
          screen.getByText(/The Legend of Zelda: Breath of the Wild/)
        ).toBeVisible();
      });
    });

    it("should explain multiple platform use case", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} isEditMode />);

      await waitFor(() => {
        expect(
          screen.getByText(/own the game on multiple platforms/)
        ).toBeVisible();
      });
    });
  });

  describe("given user cancels form", () => {
    it("should call onCancel callback", async () => {
      const onCancel = vi.fn();
      renderWithQueryClient(
        <AddEntryForm {...defaultProps} onCancel={onCancel} />
      );

      await actions.clickCancel();

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
