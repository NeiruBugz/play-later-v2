import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QuickAddButton } from "./quick-add-button";

const addGameToLibraryFn = vi.fn();
const invalidate = vi.fn();

vi.mock("../../api/add-game-to-library-fn", () => ({
  addGameToLibraryFn: (...args: unknown[]) => addGameToLibraryFn(...args),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const elements = {
  getAddButton: () =>
    screen.getByRole("button", { name: "Add Hades to library" }),
  queryAddedButton: () => screen.queryByRole("button", { name: "Hades added" }),
};

const actions = {
  clickAdd: () => userEvent.click(elements.getAddButton()),
};

describe("QuickAddButton", () => {
  beforeEach(() => {
    addGameToLibraryFn.mockReset();
    invalidate.mockReset();
  });

  describe("given the user taps add", () => {
    beforeEach(async () => {
      addGameToLibraryFn.mockResolvedValue({});
      render(<QuickAddButton igdbId={1234} gameTitle="Hades" />);
      await actions.clickAdd();
    });

    it("adds the game by its IGDB id", () => {
      expect(addGameToLibraryFn).toHaveBeenCalledWith({
        data: { igdbId: 1234 },
      });
    });

    it("locks into an added state afterwards", () => {
      expect(elements.queryAddedButton()).not.toBeNull();
    });
  });

  describe("given the add fails", () => {
    beforeEach(async () => {
      addGameToLibraryFn.mockRejectedValue(new Error("nope"));
      render(<QuickAddButton igdbId={1234} gameTitle="Hades" />);
      await actions.clickAdd();
    });

    it("returns to the addable state so the user can retry", () => {
      expect(elements.getAddButton()).toBeEnabled();
    });
  });
});
