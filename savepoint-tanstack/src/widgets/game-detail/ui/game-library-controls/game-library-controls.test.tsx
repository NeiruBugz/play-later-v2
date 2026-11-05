import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildLibraryItem } from "../../../../../test/factories/builders.ts";
import { GameLibraryControls } from "./game-library-controls";

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
vi.mock("@/features/add-game", () => ({ AddGameAction: () => null }));
vi.mock("@/features/library-prompts/ui/game-prompts", () => ({
  GamePrompts: () => null,
}));
vi.mock("@/entities/session/api/get-session.server", () => ({
  getServerUserId: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function Harness({ isOwned = true }: { isOwned?: boolean }) {
  return (
    <GameLibraryControls
      igdbId={1}
      gameTitle="Hades"
      entry={buildLibraryItem({ id: 7, status: "PLAYING" })}
      libraryStatus={{
        status: "PLAYING",
        setStatus: vi.fn(),
        isPending: false,
      }}
      libraryOwnership={{
        isOwned,
        setOwned: setOwnedMock,
        isPending: false,
      }}
    />
  );
}

const elements = {
  getTrigger: () =>
    screen.getByRole("button", { name: "More library actions" }),
  getItem: (name: string) => screen.getByRole("menuitem", { name }),
  queryItem: (name: string) => screen.queryByRole("menuitem", { name }),
  queryRemoveDialog: () =>
    screen.queryByText("Remove Hades from your library?"),
  getConfirmRemove: () => screen.getByRole("button", { name: "Remove" }),
};

const actions = {
  openMenu: () => userEvent.click(elements.getTrigger()),
  chooseItem: (name: string) => userEvent.click(elements.getItem(name)),
};

describe("GameLibraryControls actions menu", () => {
  beforeEach(() => {
    deleteMock.mockReset();
    deleteMock.mockResolvedValue(undefined);
    invalidateMock.mockReset();
    invalidateMock.mockResolvedValue(undefined);
    setOwnedMock.mockReset();
  });

  describe("given the menu is closed", () => {
    beforeEach(() => {
      render(<Harness />);
    });

    it("shows no actions", () => {
      expect(elements.queryItem("Remove from library")).toBeNull();
    });
  });

  describe("given an owned game and the user chooses the ownership action", () => {
    beforeEach(async () => {
      render(<Harness isOwned />);
      await actions.openMenu();
      await actions.chooseItem("I don't own it yet");
    });

    it("marks the game as not owned and closes the menu", () => {
      expect(setOwnedMock).toHaveBeenCalledExactlyOnceWith(false);
      expect(elements.queryItem("Remove from library")).toBeNull();
    });
  });

  describe("given the user chooses Remove from library with the pointer", () => {
    beforeEach(async () => {
      render(<Harness />);
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

  describe("given the user reaches Remove from library with the keyboard", () => {
    beforeEach(async () => {
      render(<Harness />);
      elements.getTrigger().focus();
      await userEvent.keyboard("{ArrowDown}");
      await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    });

    it("opens the remove confirmation", () => {
      expect(elements.queryRemoveDialog()).toBeInTheDocument();
    });
  });
});
