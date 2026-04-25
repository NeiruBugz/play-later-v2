import { renderWithTestProviders as render } from "@/test/utils/test-provider";
import { screen, within } from "@testing-library/react";

import { LibraryItemStatus } from "@/shared/types";

import type { LibraryItemWithGameDomain } from "../types";
import { LibraryCardListRow } from "./library-card-list-row";

vi.mock("../server-actions/update-library-status", () => ({
  updateLibraryStatusAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/features/manage-library-entry/server-actions", () => ({
  setLibraryRatingAction: vi.fn().mockResolvedValue({ success: true }),
  deleteLibraryItemAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/features/manage-library-entry", () => ({
  LibraryModal: () => null,
}));

vi.mock("@/features/journal", () => ({
  JournalQuickEntrySheet: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="journal-sheet" /> : null,
}));

function makeItem(
  overrides: Partial<LibraryItemWithGameDomain> = {}
): LibraryItemWithGameDomain {
  return {
    id: 1,
    userId: "user-1",
    gameId: "game-1",
    status: LibraryItemStatus.PLAYING,
    platform: "PC (Windows)",
    startedAt: new Date("2025-01-01"),
    completedAt: null,
    statusChangedAt: new Date("2025-01-02"),
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-02"),
    rating: 8,
    hasBeenPlayed: false,
    acquisitionType: "DIGITAL",
    game: {
      id: "game-1",
      igdbId: 123,
      title: "Elden Ring",
      coverImage: "co1234.jpg",
      slug: "elden-ring",
      releaseDate: null,
      _count: { libraryItems: 1 },
    },
    ...overrides,
  } as LibraryItemWithGameDomain;
}

describe("LibraryCardListRow", () => {
  it("renders the cover thumbnail with status badge overlay", () => {
    render(<LibraryCardListRow item={makeItem()} />);

    expect(screen.getByTestId("game-cover-container")).toBeInTheDocument();
    expect(screen.getByLabelText(/Status:/i)).toBeInTheDocument();
  });

  it("renders title, metadata, rating, and CTA", () => {
    render(<LibraryCardListRow item={makeItem()} />);

    expect(screen.getByText("Elden Ring")).toBeInTheDocument();
    expect(screen.getByTestId("library-card-metadata")).toBeInTheDocument();
    expect(screen.getByTestId("library-card-rating")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Log Session/i })
    ).toBeInTheDocument();
  });

  it("renders the actions menu trigger", () => {
    render(<LibraryCardListRow item={makeItem()} />);

    expect(
      screen.getByRole("button", { name: /Actions for Elden Ring/i })
    ).toBeInTheDocument();
  });

  it("renders the CTA full-width", () => {
    render(<LibraryCardListRow item={makeItem()} />);

    const cta = screen.getByRole("button", { name: /Log Session/i });
    expect(cta).toHaveClass("w-full");
  });

  it("wraps the row in a link to the game detail route", () => {
    render(<LibraryCardListRow item={makeItem()} />);

    const link = screen.getByRole("listitem", { name: "Elden Ring" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/games/elden-ring");
  });

  it("hides the badge when its status equals the active filter", () => {
    render(
      <LibraryCardListRow
        item={makeItem({ status: LibraryItemStatus.PLAYING })}
        activeStatusFilter={LibraryItemStatus.PLAYING}
      />
    );

    expect(
      screen.queryByRole("status", { name: /Status:/i })
    ).not.toBeInTheDocument();
  });

  it("renders all primary content inside the link container", () => {
    render(<LibraryCardListRow item={makeItem()} />);
    const link = screen.getByRole("listitem", { name: "Elden Ring" });
    expect(within(link).getByText("Elden Ring")).toBeInTheDocument();
    expect(
      within(link).getByRole("button", { name: /Log Session/i })
    ).toBeInTheDocument();
  });
});
