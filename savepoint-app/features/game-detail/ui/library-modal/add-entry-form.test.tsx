import { LibraryItemStatus } from "@prisma/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
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

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockAddToLibraryAction = vi.mocked(addToLibraryAction);

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
    // Use getAllByText and select the first one (inside the dropdown)
    const statusOptions = screen.getAllByText(statusLabel);
    await userEvent.click(statusOptions[statusOptions.length - 1]);
  },

  selectPlatform: async (platformName: string) => {
    // Wait for platforms to load
    await waitFor(
      () => {
        expect(elements.getPlatformTrigger()).toBeEnabled();
      },
      { timeout: 3000 }
    );
    await userEvent.click(elements.getPlatformTrigger());
    // Wait for the command menu to appear
    await waitFor(
      () => {
        const options = screen.queryAllByRole("option");
        expect(options.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
    // Find and click the platform option
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

  describe("given date fields rendering (Slice 9)", () => {
    it("should display 'Started At' date field with optional label", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await waitFor(() => {
        const label = screen.getByText(/started at \(optional\)/i);
        expect(label).toBeVisible();
      });
    });

    it("should display 'Completed At' date field with optional label", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await waitFor(() => {
        const label = screen.getByText(/completed at \(optional\)/i);
        expect(label).toBeVisible();
      });
    });

    it("should display helper text for Started At field", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await waitFor(() => {
        expect(elements.getStartedAtDescription()).toBeVisible();
      });
    });

    it("should display helper text for Completed At field", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await waitFor(() => {
        expect(elements.getCompletedAtDescription()).toBeVisible();
      });
    });

    it("should render both date inputs as type='date'", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveAttribute("type", "date");
        expect(elements.getCompletedAtInput()).toHaveAttribute("type", "date");
      });
    });

    it("should render date fields with empty values initially", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("");
        expect(elements.getCompletedAtInput()).toHaveValue("");
      });
    });
  });

  describe("given user fills date fields (Slice 9)", () => {
    it("should allow user to set Started At date", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await actions.typeStartedAtDate("2025-01-15");

      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("2025-01-15");
      });
    });

    it("should allow user to set Completed At date", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await actions.typeCompletedAtDate("2025-02-20");

      await waitFor(() => {
        expect(elements.getCompletedAtInput()).toHaveValue("2025-02-20");
      });
    });

    it("should allow user to set both dates", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await actions.typeStartedAtDate("2025-01-10");
      await actions.typeCompletedAtDate("2025-01-25");

      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("2025-01-10");
        expect(elements.getCompletedAtInput()).toHaveValue("2025-01-25");
      });
    });

    it("should allow user to clear Started At date", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await actions.typeStartedAtDate("2025-01-15");
      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("2025-01-15");
      });

      await actions.clearStartedAtDate();

      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("");
      });
    });

    it("should allow user to clear Completed At date", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await actions.typeCompletedAtDate("2025-02-20");
      await waitFor(() => {
        expect(elements.getCompletedAtInput()).toHaveValue("2025-02-20");
      });

      await actions.clearCompletedAtDate();

      await waitFor(() => {
        expect(elements.getCompletedAtInput()).toHaveValue("");
      });
    });
  });

  describe("given form submission with date fields (Slice 9)", () => {
    it("should include date fields in form data when filled", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      // Fill form including dates
      await actions.typeStartedAtDate("2025-01-15");
      await actions.typeCompletedAtDate("2025-02-20");

      // Verify dates are set in form
      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("2025-01-15");
        expect(elements.getCompletedAtInput()).toHaveValue("2025-02-20");
      });
    });

    it("should allow submitting form with startedAt date only", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await actions.typeStartedAtDate("2025-01-15");

      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("2025-01-15");
        expect(elements.getCompletedAtInput()).toHaveValue("");
      });
    });

    it("should allow submitting form with completedAt date only", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await actions.typeCompletedAtDate("2025-02-20");

      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("");
        expect(elements.getCompletedAtInput()).toHaveValue("2025-02-20");
      });
    });

    it("should allow submitting form with both date fields", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await actions.typeStartedAtDate("2025-01-10");
      await actions.typeCompletedAtDate("2025-02-15");

      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("2025-01-10");
        expect(elements.getCompletedAtInput()).toHaveValue("2025-02-15");
      });
    });

    it("should allow submitting form without any dates (optional behavior)", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      // Do not fill date fields - verify they remain empty
      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("");
        expect(elements.getCompletedAtInput()).toHaveValue("");
      });
    });

    it("should handle clearing date after it was set", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await actions.typeStartedAtDate("2025-01-15");
      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("2025-01-15");
      });

      // Clear the date
      await actions.clearStartedAtDate();

      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("");
      });
    });

    it("should maintain date values when user interacts with other fields", async () => {
      renderWithQueryClient(<AddEntryForm {...defaultProps} />);

      await actions.typeStartedAtDate("2025-01-15");
      await actions.typeCompletedAtDate("2025-02-20");

      // Click on status dropdown (to check dates persist)
      await userEvent.click(elements.getStatusTrigger());

      // Dates should still be set
      await waitFor(() => {
        expect(elements.getStartedAtInput()).toHaveValue("2025-01-15");
        expect(elements.getCompletedAtInput()).toHaveValue("2025-02-20");
      });
    });
  });
});
