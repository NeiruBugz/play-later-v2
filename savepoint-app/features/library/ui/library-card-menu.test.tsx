import { renderWithTestProviders as render } from "@/test/utils/test-provider";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LibraryItemStatus } from "@/shared/types";

import type { LibraryItemWithGameDomain } from "../types";
import { LibraryCardMenu } from "./library-card-menu";

const mockUpdateLibraryStatusAction = vi.fn();
const mockDeleteLibraryItemAction = vi.fn();

vi.mock("../server-actions/update-library-status", () => ({
  updateLibraryStatusAction: (...args: unknown[]) =>
    mockUpdateLibraryStatusAction(...args),
}));

vi.mock("@/features/manage-library-entry/server-actions", () => ({
  deleteLibraryItemAction: (...args: unknown[]) =>
    mockDeleteLibraryItemAction(...args),
}));

vi.mock("@/features/manage-library-entry", () => ({
  LibraryModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="library-modal" /> : null,
}));

function makeItem(
  status: LibraryItemStatus = LibraryItemStatus.PLAYING,
  overrides: Partial<LibraryItemWithGameDomain> = {}
): LibraryItemWithGameDomain {
  return {
    id: 42,
    userId: "user-1",
    gameId: "game-1",
    status,
    platform: null,
    startedAt: null,
    completedAt: null,
    statusChangedAt: new Date("2025-01-01"),
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    rating: null,
    hasBeenPlayed: false,
    acquisitionType: "DIGITAL",
    game: {
      id: "game-1",
      igdbId: 123,
      title: "Elden Ring",
      coverImage: null,
      slug: "elden-ring",
      releaseDate: null,
      _count: { libraryItems: 1 },
    },
    ...overrides,
  } as LibraryItemWithGameDomain;
}

describe("LibraryCardMenu", () => {
  beforeEach(() => {
    mockUpdateLibraryStatusAction.mockResolvedValue({ success: true });
    mockDeleteLibraryItemAction.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the trigger button without hover (always visible)", () => {
    render(<LibraryCardMenu libraryItem={makeItem()} />);
    expect(
      screen.getByRole("button", { name: /Actions for Elden Ring/i })
    ).toBeVisible();
  });

  it("opens menu and shows all four primary items", async () => {
    const user = userEvent.setup();
    render(<LibraryCardMenu libraryItem={makeItem()} />);

    await user.click(
      screen.getByRole("button", { name: /Actions for Elden Ring/i })
    );

    expect(
      screen.getByRole("menuitem", { name: /View Journal Entries/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Edit Library Details/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Change Status/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Remove from Library/i })
    ).toBeInTheDocument();
  });

  it("renders the View Journal Entries item as a link to the game journal anchor", async () => {
    const user = userEvent.setup();
    render(<LibraryCardMenu libraryItem={makeItem()} />);

    await user.click(
      screen.getByRole("button", { name: /Actions for Elden Ring/i })
    );

    const item = screen.getByRole("menuitem", {
      name: /View Journal Entries/i,
    });
    expect(item).toHaveAttribute("href", "/games/elden-ring#journal-heading");
  });

  it("opens the edit dialog when Edit Library Details is clicked", async () => {
    const user = userEvent.setup();
    render(<LibraryCardMenu libraryItem={makeItem()} />);

    await user.click(
      screen.getByRole("button", { name: /Actions for Elden Ring/i })
    );
    await user.click(
      screen.getByRole("menuitem", { name: /Edit Library Details/i })
    );

    expect(screen.getByTestId("library-modal")).toBeInTheDocument();
  });

  it("opens the Change Status submenu with all five status options", async () => {
    const user = userEvent.setup();
    render(
      <LibraryCardMenu libraryItem={makeItem(LibraryItemStatus.PLAYING)} />
    );

    await user.click(
      screen.getByRole("button", { name: /Actions for Elden Ring/i })
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: /Change Status/i,
    });
    subTrigger.focus();
    await user.keyboard("{ArrowRight}");

    for (const label of ["Up Next", "Playing", "Shelf", "Played", "Wishlist"]) {
      expect(
        await screen.findByRole("menuitem", {
          name: new RegExp(`Change status to ${label}`, "i"),
        })
      ).toBeInTheDocument();
    }
  });

  it.each([
    [LibraryItemStatus.UP_NEXT, "Up Next"],
    [LibraryItemStatus.SHELF, "Shelf"],
    [LibraryItemStatus.PLAYED, "Played"],
    [LibraryItemStatus.WISHLIST, "Wishlist"],
  ])(
    "submenu — selecting %s dispatches updateLibraryStatusAction with status only (no hasBeenPlayed/startedAt)",
    async (targetStatus, label) => {
      const user = userEvent.setup();
      render(
        <LibraryCardMenu libraryItem={makeItem(LibraryItemStatus.PLAYING)} />
      );

      await user.click(
        screen.getByRole("button", { name: /Actions for Elden Ring/i })
      );
      await user.hover(
        screen.getByRole("menuitem", { name: /Change Status/i })
      );
      const item = await screen.findByRole("menuitem", {
        name: new RegExp(`Change status to ${label}`, "i"),
      });
      item.focus();
      await user.keyboard("{Enter}");

      expect(mockUpdateLibraryStatusAction).toHaveBeenCalledTimes(1);
      const payload = mockUpdateLibraryStatusAction.mock.calls[0]![0] as Record<
        string,
        unknown
      >;
      expect(payload).toEqual({
        libraryItemId: 42,
        status: targetStatus,
      });
      expect(payload).not.toHaveProperty("hasBeenPlayed");
      expect(payload).not.toHaveProperty("startedAt");
    }
  );

  it("submenu — selecting current status is disabled and does not dispatch", async () => {
    const user = userEvent.setup();
    render(
      <LibraryCardMenu libraryItem={makeItem(LibraryItemStatus.PLAYING)} />
    );

    await user.click(
      screen.getByRole("button", { name: /Actions for Elden Ring/i })
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: /Change Status/i,
    });
    subTrigger.focus();
    await user.keyboard("{ArrowRight}");
    const item = await screen.findByRole("menuitem", {
      name: /Change status to Playing/i,
    });
    expect(item).toHaveAttribute("aria-disabled", "true");
  });

  it("dispatches deleteLibraryItemAction when Remove from Library is clicked", async () => {
    const user = userEvent.setup();
    render(<LibraryCardMenu libraryItem={makeItem()} />);

    await user.click(
      screen.getByRole("button", { name: /Actions for Elden Ring/i })
    );
    await user.click(
      screen.getByRole("menuitem", { name: /Remove from Library/i })
    );

    expect(mockDeleteLibraryItemAction).toHaveBeenCalledWith({
      libraryItemId: 42,
    });
  });

  it("trigger click does not bubble to parent (card link)", async () => {
    const user = userEvent.setup();
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick} role="presentation">
        <LibraryCardMenu libraryItem={makeItem()} />
      </div>
    );

    await user.click(
      screen.getByRole("button", { name: /Actions for Elden Ring/i })
    );

    expect(parentClick).not.toHaveBeenCalled();
  });
});
