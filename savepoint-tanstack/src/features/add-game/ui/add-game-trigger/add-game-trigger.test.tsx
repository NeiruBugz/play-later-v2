import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddGameTrigger } from "./add-game-trigger";

// Mock the server fns the modal calls so the rendered dialog body never
// crosses the network or server boundary.
vi.mock("@/features/add-game/api/search-games-fn", () => ({
  searchGamesFn: vi.fn(),
}));

vi.mock("@/features/add-game/api/add-game-to-library-fn", () => ({
  addGameToLibraryFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: vi.fn(() => ({ invalidate: vi.fn() })),
}));

const elements = {
  getTriggerButton: () => screen.getByRole("button", { name: "Add game" }),
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

  describe("given the AddGameModal calls onAdded (e.g. after a successful add)", () => {
    beforeEach(async () => {
      const { addGameToLibraryFn } =
        await import("@/features/add-game/api/add-game-to-library-fn");
      const { searchGamesFn } =
        await import("@/features/add-game/api/search-games-fn");
      vi.mocked(addGameToLibraryFn).mockResolvedValue(undefined as never);
      vi.mocked(searchGamesFn).mockResolvedValue({
        games: [{ id: 1234, name: "Half-Life 2" }],
        count: 1,
      } as never);

      render(<AddGameTrigger />);
      await actions.clickTrigger();

      const searchInput = screen.getByRole("searchbox", {
        name: "Search games",
      });
      await userEvent.type(searchInput, "half{Enter}");

      await waitFor(() => {
        expect(screen.queryByText("Half-Life 2")).not.toBeNull();
      });
      await userEvent.click(screen.getByText("Half-Life 2"));

      await userEvent.click(
        screen.getByRole("button", { name: "Add to library" })
      );
    });

    it("closes the dialog after onAdded fires (dialog disappears)", async () => {
      await waitFor(() => {
        expect(elements.queryDialog()).toBeNull();
      });
    });
  });

  describe('given variant="fab"', () => {
    beforeEach(() => {
      render(<AddGameTrigger variant="fab" />);
    });

    it("renders a circular floating action button with the same aria-label", () => {
      const fab = elements.getTriggerButton();
      expect(fab.className).toMatch(/fixed/);
      expect(fab.className).toMatch(/rounded-full/);
    });

    it("still opens the dialog on click", async () => {
      await actions.clickTrigger();
      expect(elements.queryDialog()).not.toBeNull();
    });
  });
});
