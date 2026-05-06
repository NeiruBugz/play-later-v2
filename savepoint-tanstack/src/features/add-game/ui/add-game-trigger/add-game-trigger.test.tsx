import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the server fns the modal calls so the rendered dialog body never
// crosses the network or server boundary.
vi.mock("@/features/add-game/api/search-games-fn", () => ({
  searchGamesFn: vi.fn(),
}));

vi.mock("@/features/add-game/api/add-game-to-library-fn", () => ({
  addGameToLibraryFn: vi.fn(),
}));

import { AddGameTrigger } from "./add-game-trigger";

const elements = {
  getTriggerButton: () =>
    screen.getByRole("button", { name: "Add game" }),
  queryDialog: () => screen.queryByRole("dialog"),
  queryDialogTitle: () =>
    screen.queryByRole("heading", { name: "Add game", level: 2 }),
  querySearchInput: () =>
    screen.queryByRole("searchbox", { name: "Search games" }),
};

const actions = {
  clickTrigger: () => userEvent.click(elements.getTriggerButton()),
};

describe("AddGameTrigger", () => {
  describe("given the trigger has not been clicked", () => {
    beforeEach(() => {
      render(<AddGameTrigger />);
    });

    it("renders the trigger button", () => {
      expect(elements.getTriggerButton()).toBeDefined();
    });

    it("does not render the dialog", () => {
      expect(elements.queryDialog()).toBeNull();
    });

    it("does not render the modal's search input before opening", () => {
      expect(elements.querySearchInput()).toBeNull();
    });
  });

  describe("given the user clicks the trigger", () => {
    beforeEach(async () => {
      render(<AddGameTrigger />);
      await actions.clickTrigger();
    });

    it("opens the dialog", () => {
      expect(elements.queryDialog()).not.toBeNull();
    });

    it("renders the dialog title", () => {
      expect(elements.queryDialogTitle()).not.toBeNull();
    });

    it("renders the AddGameModal search input inside the dialog", () => {
      expect(elements.querySearchInput()).not.toBeNull();
    });
  });
});
