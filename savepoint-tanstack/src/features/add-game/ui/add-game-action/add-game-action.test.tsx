import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddFollowUpsProvider } from "../../model/add-follow-ups-context";
import type { AddFollowUps } from "../../model/add-game.type";
import { AddGameAction } from "./add-game-action";

const { addGameFnMock, undoAddGameFnMock, invalidateMock } = vi.hoisted(() => ({
  addGameFnMock: vi.fn(),
  undoAddGameFnMock: vi.fn(),
  invalidateMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: invalidateMock }),
}));
vi.mock("../../api/add-game-fn", () => ({ addGameFn: addGameFnMock }));
vi.mock("../../api/undo-add-game-fn", () => ({
  undoAddGameFn: undoAddGameFnMock,
}));

const followUps: AddFollowUps = {
  startPlaying: vi.fn(),
  putInUpNext: vi.fn(),
  saveWhy: vi.fn(),
};

const elements = {
  getAddIcon: () => screen.getByRole("button", { name: "Add Hades" }),
  getAddLabelled: () => screen.getByRole("button", { name: "Add to library" }),
  findConfirmation: (text: string) => screen.findByText(text),
  findButton: (name: string) => screen.findByRole("button", { name }),
  queryButton: (name: string) => screen.queryByRole("button", { name }),
  queryInLibrary: () => screen.queryByText("In library"),
};

function renderAction(
  props: Partial<React.ComponentProps<typeof AddGameAction>> = {}
) {
  render(
    <AddFollowUpsProvider value={followUps}>
      <AddGameAction
        game={{ igdbId: 7, name: "Hades", library: null }}
        {...props}
      />
      <Toaster />
    </AddFollowUpsProvider>
  );
}

const added = (overrides = {}) => ({
  libraryItemId: 11,
  created: true,
  status: "WANT",
  upNextPosition: null,
  ...overrides,
});

describe("AddGameAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(followUps.startPlaying).mockResolvedValue(true);
    vi.mocked(followUps.putInUpNext).mockResolvedValue(true);
    undoAddGameFnMock.mockResolvedValue({});
    addGameFnMock.mockResolvedValue(added());
  });

  describe("given the user taps the icon add", () => {
    beforeEach(async () => {
      renderAction();
      await userEvent.click(elements.getAddIcon());
    });

    it("adds the game by its IGDB id", () => {
      expect(addGameFnMock).toHaveBeenCalledWith({ data: { igdbId: 7 } });
    });

    it("confirms with Start playing, Put in Up Next and Undo", async () => {
      expect(
        await elements.findConfirmation("Added Hades to Want")
      ).toBeDefined();
      expect(await elements.findButton("Start playing")).toBeDefined();
      expect(await elements.findButton("Put in Up Next")).toBeDefined();
      expect(await elements.findButton("Undo")).toBeDefined();
    });

    it("swaps the plus for In library", async () => {
      expect(await screen.findByText("In library")).toBeDefined();
      expect(elements.queryButton("Add Hades")).toBeNull();
    });
  });

  describe("given the labelled variant", () => {
    it("adds from the Add to library button", async () => {
      renderAction({
        game: { igdbId: 7, name: "Hades", library: null },
        variant: "labelled",
      });
      await userEvent.click(elements.getAddLabelled());
      expect(addGameFnMock).toHaveBeenCalledWith({ data: { igdbId: 7 } });
      expect(
        await elements.findConfirmation("Added Hades to Want")
      ).toBeDefined();
    });
  });

  describe("given the game was already in the library", () => {
    beforeEach(async () => {
      addGameFnMock.mockResolvedValue(
        added({ created: false, status: "DONE", upNextPosition: 2 })
      );
      renderAction();
      await userEvent.click(elements.getAddIcon());
    });

    it("shows its status and no Undo", async () => {
      expect(
        await elements.findConfirmation("Hades is already in your library")
      ).toBeDefined();
      expect(elements.queryButton("Undo")).toBeNull();
    });
  });

  describe("given the user taps Undo", () => {
    beforeEach(async () => {
      renderAction();
      await userEvent.click(elements.getAddIcon());
      await userEvent.click(await elements.findButton("Undo"));
    });

    it("undoes the add by library item id", () => {
      expect(undoAddGameFnMock).toHaveBeenCalledWith({
        data: { libraryItemId: 11 },
      });
    });

    it("shows the plus again", async () => {
      expect(
        await screen.findByRole("button", { name: "Add Hades" })
      ).toBeDefined();
    });
  });

  describe("given the server refuses the undo", () => {
    beforeEach(async () => {
      undoAddGameFnMock.mockRejectedValue({
        code: "CONFLICT",
        context: { code: "UNDO_ADD_UNAVAILABLE" },
      });
      renderAction();
      await userEvent.click(elements.getAddIcon());
      await userEvent.click(await elements.findButton("Undo"));
    });

    it("shows the mapped message and keeps the game", async () => {
      expect(
        await screen.findByText(
          "This game can't be undone anymore. Remove it from your library instead."
        )
      ).toBeDefined();
      expect(elements.queryInLibrary()).not.toBeNull();
    });
  });

  describe("given the user taps Start playing", () => {
    beforeEach(async () => {
      renderAction();
      await userEvent.click(elements.getAddIcon());
      await userEvent.click(await elements.findButton("Start playing"));
    });

    it("hands the added item to the follow-up", () => {
      expect(followUps.startPlaying).toHaveBeenCalledWith(
        expect.objectContaining({ libraryItemId: 11, gameTitle: "Hades" }),
        expect.any(Function)
      );
    });
  });

  describe("given the user taps Put in Up Next", () => {
    beforeEach(async () => {
      renderAction();
      await userEvent.click(elements.getAddIcon());
      await userEvent.click(await elements.findButton("Put in Up Next"));
    });

    it("hands the added item to the follow-up", () => {
      expect(followUps.putInUpNext).toHaveBeenCalledWith(
        expect.objectContaining({ libraryItemId: 11 }),
        expect.any(Function)
      );
    });
  });

  describe("given the add cannot be saved", () => {
    beforeEach(async () => {
      addGameFnMock.mockRejectedValue(new Error("boom"));
      renderAction();
      await userEvent.click(elements.getAddIcon());
    });

    it("shows the game-specific failure and keeps the plus", async () => {
      expect(
        await screen.findByText("Couldn't add Hades. Try again.")
      ).toBeDefined();
      await waitFor(() => expect(elements.getAddIcon()).toBeEnabled());
    });
  });

  describe("given 8 seconds pass", () => {
    it("dismisses the confirmation and keeps the game", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        renderAction();
        await userEvent.click(elements.getAddIcon());
        expect(
          await elements.findConfirmation("Added Hades to Want")
        ).toBeDefined();
        await vi.advanceTimersByTimeAsync(8000);
        await waitFor(() =>
          expect(screen.queryByText("Added Hades to Want")).toBeNull()
        );
        expect(elements.queryInLibrary()).not.toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
