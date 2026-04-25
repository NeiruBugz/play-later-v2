import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import type { LibraryItemDomain } from "@/features/library/types";
import { AcquisitionType, LibraryItemStatus } from "@/shared/types/library";

import { updateLibraryEntryAction } from "../server-actions";
import { EditEntryForm } from "./edit-entry-form";

vi.mock("@/features/manage-library-entry/hooks/use-get-platforms", () => ({
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
  updateLibraryEntryAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/shared/lib/date", () => ({
  formatRelativeDate: vi.fn(() => "today"),
}));

const baseItem: LibraryItemDomain = {
  id: 1,
  userId: "user-123",
  gameId: "game-abc",
  status: LibraryItemStatus.PLAYING,
  platform: "PlayStation 5",
  acquisitionType: AcquisitionType.DIGITAL,
  startedAt: null,
  completedAt: null,
  hasBeenPlayed: false,
  statusChangedAt: null,
  rating: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
} as LibraryItemDomain;

function renderEditForm(item: LibraryItemDomain = baseItem) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <EditEntryForm
        item={item}
        igdbId={555}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />
    </QueryClientProvider>
  );
}

const mockSuccessfulUpdate = (overrides: Partial<LibraryItemDomain> = {}) =>
  vi.mocked(updateLibraryEntryAction).mockResolvedValue({
    success: true as const,
    data: { ...baseItem, ...overrides },
  });

describe("EditEntryForm - platform editing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pre-selects the existing platform value in the combobox", () => {
    renderEditForm();
    const trigger = screen.getByRole("combobox", { name: /platform/i });
    expect(trigger).toHaveTextContent("PlayStation 5");
  });

  it("shows a legacy value as a sticky '(legacy)' option", async () => {
    const user = userEvent.setup();
    renderEditForm({ ...baseItem, platform: "GameCube" });

    const trigger = screen.getByRole("combobox", { name: /platform/i });
    expect(trigger).toHaveTextContent("GameCube (legacy)");

    await user.click(trigger);
    expect(
      await screen.findByRole("option", { name: /GameCube \(legacy\)/i })
    ).toBeVisible();
  });

  it("submits the newly chosen platform value", async () => {
    const user = userEvent.setup();
    mockSuccessfulUpdate({ platform: "PC" });
    renderEditForm();

    await user.click(screen.getByRole("combobox", { name: /platform/i }));
    const pcOption = await screen.findByRole("option", { name: "PC" });
    await user.click(pcOption);

    await user.click(screen.getByRole("button", { name: /update entry/i }));

    await waitFor(() => {
      expect(updateLibraryEntryAction).toHaveBeenCalled();
    });
    const callArgs = vi.mocked(updateLibraryEntryAction).mock.calls[0][0];
    expect(callArgs.platform).toBe("PC");
  });

  it("submits the raw legacy name (without the '(legacy)' suffix) when the legacy option is re-selected", async () => {
    const user = userEvent.setup();
    mockSuccessfulUpdate({ platform: "GameCube" });
    renderEditForm({ ...baseItem, platform: "GameCube" });

    await user.click(screen.getByRole("combobox", { name: /platform/i }));
    const legacyOption = await screen.findByRole("option", {
      name: /GameCube \(legacy\)/i,
    });
    await user.click(legacyOption);

    await user.click(screen.getByRole("button", { name: /update entry/i }));

    await waitFor(() => {
      expect(updateLibraryEntryAction).toHaveBeenCalled();
    });
    const callArgs = vi.mocked(updateLibraryEntryAction).mock.calls[0][0];
    expect(callArgs.platform).toBe("GameCube");
  });
});
