import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildLibraryItem } from "../../../../../test/factories/builders.ts";
import { GameMoreMenu } from "./game-more-menu";

const { deleteMock, invalidateMock, setOwnedMock } = vi.hoisted(() => ({
  deleteMock: vi.fn(),
  invalidateMock: vi.fn(),
  setOwnedMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: invalidateMock }),
}));
vi.mock("@/features/manage-library-entry/api/delete-library-item-fn", () => ({
  deleteLibraryItemFn: deleteMock,
}));
vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: () => true,
}));
vi.mock("@/entities/session/api/get-session.server", () => ({
  getServerUserId: vi.fn(),
}));
vi.mock("@/features/manage-library-entry/api/get-platform-options", () => ({
  getPlatformOptionsFn: vi.fn(() => Promise.resolve([])),
}));
vi.mock("@/features/manage-library-entry/api/search-platforms-fn", () => ({
  searchPlatformsFn: vi.fn(() => Promise.resolve([])),
}));
vi.mock("@/features/manage-library-entry/api/update-library-item-fn", () => ({
  updateLibraryItemFn: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type MenuOptions = {
  status?: "WANT" | "PLAYING" | "DONE";
  isOwned?: boolean;
  inLibrary?: boolean;
};

function renderMenu({
  status = "WANT",
  isOwned = true,
  inLibrary = true,
}: MenuOptions = {}) {
  render(
    <GameMoreMenu
      igdbId={1}
      gameTitle="Hades"
      entry={inLibrary ? buildLibraryItem({ id: 7, status }) : null}
      libraryStatus={
        inLibrary ? { status, setStatus: vi.fn(), isPending: false } : null
      }
      libraryOwnership={
        inLibrary ? { isOwned, setOwned: setOwnedMock, isPending: false } : null
      }
    />
  );
}

const elements = {
  queryTrigger: () =>
    screen.queryByRole("button", { name: "More library actions" }),
  getTrigger: () =>
    screen.getByRole("button", { name: "More library actions" }),
  queryItem: (name: string) => screen.queryByRole("menuitem", { name }),
  getItem: (name: string) => screen.getByRole("menuitem", { name }),
  queryRemoveDialog: () =>
    screen.queryByText("Remove Hades from your library?"),
  getConfirmRemove: () => screen.getByRole("button", { name: "Remove" }),
};

const actions = {
  openMenu: () => userEvent.click(elements.getTrigger()),
  chooseItem: (name: string) => userEvent.click(elements.getItem(name)),
};

describe("GameMoreMenu", () => {
  beforeEach(() => {
    deleteMock.mockReset();
    deleteMock.mockResolvedValue(undefined);
    invalidateMock.mockReset();
    invalidateMock.mockResolvedValue(undefined);
    setOwnedMock.mockReset();
  });

  describe("given a Want game in the library", () => {
    beforeEach(async () => {
      renderMenu({ status: "WANT", isOwned: true });
      await actions.openMenu();
    });

    it("lists Edit details…, the ownership choice, the Up Next action and Remove from library", () => {
      expect(elements.queryItem("Edit details…")).toBeInTheDocument();
      expect(elements.queryItem("I don't own it yet")).toBeInTheDocument();
      expect(elements.queryItem("Put in Up Next")).toBeInTheDocument();
      expect(elements.queryItem("Remove from library")).toBeInTheDocument();
    });
  });

  describe("given a game the user does not own yet", () => {
    beforeEach(async () => {
      renderMenu({ isOwned: false });
      await actions.openMenu();
    });

    it("offers I own it and marks the game owned when chosen", async () => {
      await actions.chooseItem("I own it");

      expect(setOwnedMock).toHaveBeenCalledExactlyOnceWith(true);
    });
  });

  describe("given a Playing game", () => {
    beforeEach(async () => {
      renderMenu({ status: "PLAYING" });
      await actions.openMenu();
    });

    it("leaves out the Up Next actions", () => {
      expect(elements.queryItem("Put in Up Next")).toBeNull();
      expect(elements.queryItem("Remove from library")).toBeInTheDocument();
    });
  });

  describe("given the user chooses Edit details…", () => {
    beforeEach(async () => {
      renderMenu();
      await actions.openMenu();
      await actions.chooseItem("Edit details…");
    });

    it("opens the library entry editor", () => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("given the user chooses Remove from library", () => {
    beforeEach(async () => {
      renderMenu();
      await actions.openMenu();
      await actions.chooseItem("Remove from library");
    });

    it("asks for confirmation before deleting", () => {
      expect(elements.queryRemoveDialog()).toBeInTheDocument();
      expect(deleteMock).not.toHaveBeenCalled();
    });

    it("deletes the entry once the user confirms", async () => {
      await userEvent.click(elements.getConfirmRemove());

      expect(deleteMock).toHaveBeenCalledExactlyOnceWith({
        data: { itemId: 7 },
      });
    });
  });

  describe("given the game is not in the library", () => {
    beforeEach(() => {
      renderMenu({ inLibrary: false });
    });

    it("is hidden", () => {
      expect(elements.queryTrigger()).toBeNull();
    });
  });
});
