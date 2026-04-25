import { renderWithTestProviders as render } from "@/test/utils/test-provider";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LibraryItemStatus } from "@/shared/types";

import type { LibraryItemWithGameDomain } from "../types";
import { LibraryCardCta } from "./library-card-cta";

const mockUpdateLibraryStatusAction = vi.fn();

vi.mock("../server-actions/update-library-status", () => ({
  updateLibraryStatusAction: (...args: unknown[]) =>
    mockUpdateLibraryStatusAction(...args),
}));

vi.mock("@/features/journal", () => ({
  JournalQuickEntrySheet: ({
    isOpen,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) => (isOpen ? <div data-testid="journal-sheet" /> : null),
}));

function makeItem(
  status: LibraryItemStatus,
  overrides: Partial<LibraryItemWithGameDomain> = {}
): LibraryItemWithGameDomain {
  return {
    id: 1,
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

describe("LibraryCardCta", () => {
  beforeEach(() => {
    mockUpdateLibraryStatusAction.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("label rendering per status", () => {
    it.each([
      [LibraryItemStatus.PLAYING, "Log Session"],
      [LibraryItemStatus.UP_NEXT, "Start Playing"],
      [LibraryItemStatus.SHELF, "Queue It"],
      [LibraryItemStatus.PLAYED, "Replay"],
      [LibraryItemStatus.WISHLIST, "Add to Shelf"],
    ])("renders %s label as '%s'", (status, expectedLabel) => {
      render(<LibraryCardCta libraryItem={makeItem(status)} />);
      expect(
        screen.getByRole("button", { name: expectedLabel })
      ).toBeInTheDocument();
    });
  });

  describe("PLAYING status — Log Session", () => {
    it("opens the journal sheet when clicked", async () => {
      const user = userEvent.setup();
      render(
        <LibraryCardCta libraryItem={makeItem(LibraryItemStatus.PLAYING)} />
      );

      await user.click(screen.getByRole("button", { name: "Log Session" }));

      expect(screen.getByTestId("journal-sheet")).toBeInTheDocument();
    });

    it("does not call updateLibraryStatusAction", async () => {
      const user = userEvent.setup();
      render(
        <LibraryCardCta libraryItem={makeItem(LibraryItemStatus.PLAYING)} />
      );

      await user.click(screen.getByRole("button", { name: "Log Session" }));

      expect(mockUpdateLibraryStatusAction).not.toHaveBeenCalled();
    });
  });

  describe("UP_NEXT status — Start Playing", () => {
    it("calls updateLibraryStatusAction with status PLAYING and startedAt when startedAt is null", async () => {
      const user = userEvent.setup();
      render(
        <LibraryCardCta
          libraryItem={makeItem(LibraryItemStatus.UP_NEXT, { startedAt: null })}
        />
      );

      await user.click(screen.getByRole("button", { name: "Start Playing" }));

      expect(mockUpdateLibraryStatusAction).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LibraryItemStatus.PLAYING,
          startedAt: expect.any(Date),
        })
      );
    });

    it("does not set startedAt when startedAt is already set", async () => {
      const user = userEvent.setup();
      render(
        <LibraryCardCta
          libraryItem={makeItem(LibraryItemStatus.UP_NEXT, {
            startedAt: new Date("2025-01-01"),
          })}
        />
      );

      await user.click(screen.getByRole("button", { name: "Start Playing" }));

      expect(mockUpdateLibraryStatusAction).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LibraryItemStatus.PLAYING,
          startedAt: undefined,
        })
      );
    });
  });

  describe("SHELF status — Queue It", () => {
    it("calls updateLibraryStatusAction with status UP_NEXT", async () => {
      const user = userEvent.setup();
      render(
        <LibraryCardCta libraryItem={makeItem(LibraryItemStatus.SHELF)} />
      );

      await user.click(screen.getByRole("button", { name: "Queue It" }));

      expect(mockUpdateLibraryStatusAction).toHaveBeenCalledWith(
        expect.objectContaining({ status: LibraryItemStatus.UP_NEXT })
      );
    });
  });

  describe("PLAYED status — Replay", () => {
    it("calls updateLibraryStatusAction with status UP_NEXT", async () => {
      const user = userEvent.setup();
      render(
        <LibraryCardCta libraryItem={makeItem(LibraryItemStatus.PLAYED)} />
      );

      await user.click(screen.getByRole("button", { name: "Replay" }));

      expect(mockUpdateLibraryStatusAction).toHaveBeenCalledWith(
        expect.objectContaining({ status: LibraryItemStatus.UP_NEXT })
      );
    });
  });

  describe("WISHLIST status — Add to Shelf", () => {
    it("calls updateLibraryStatusAction with status SHELF", async () => {
      const user = userEvent.setup();
      render(
        <LibraryCardCta libraryItem={makeItem(LibraryItemStatus.WISHLIST)} />
      );

      await user.click(screen.getByRole("button", { name: "Add to Shelf" }));

      expect(mockUpdateLibraryStatusAction).toHaveBeenCalledWith(
        expect.objectContaining({ status: LibraryItemStatus.SHELF })
      );
    });
  });

  describe("event propagation", () => {
    it("stops click propagation to parent", async () => {
      const user = userEvent.setup();
      const parentHandler = vi.fn();

      render(
        <div onClick={parentHandler} role="presentation">
          <LibraryCardCta libraryItem={makeItem(LibraryItemStatus.SHELF)} />
        </div>
      );

      await user.click(screen.getByRole("button", { name: "Queue It" }));

      expect(parentHandler).not.toHaveBeenCalled();
    });
  });
});
