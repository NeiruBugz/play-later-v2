import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { addGameToLibraryFn } from "@/features/add-game/api/add-game-to-library-fn";

import { AddFromGameDetailButton } from "./add-from-game-detail-button";

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
}));

vi.mock("@/features/add-game/api/add-game-to-library-fn", () => ({
  addGameToLibraryFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const elements = {
  getButton: () =>
    screen.getByRole("button", { name: "Add Hollow Knight to library" }),
  queryAlert: () => screen.queryByRole("alert"),
};

const actions = {
  click: () => userEvent.click(elements.getButton()),
};

describe("AddFromGameDetailButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given the button has been rendered", () => {
    beforeEach(() => {
      render(
        <AddFromGameDetailButton igdbId={1234} gameTitle="Hollow Knight" />
      );
    });

    it("renders the Add to library button", () => {
      expect(elements.getButton()).toBeDefined();
    });

    it("does not render an inline error alert by default", () => {
      expect(elements.queryAlert()).toBeNull();
    });
  });

  describe("given the user clicks the button and the mutation resolves", () => {
    beforeEach(async () => {
      vi.mocked(addGameToLibraryFn).mockResolvedValueOnce(
        {} as Awaited<ReturnType<typeof addGameToLibraryFn>>
      );
      render(
        <AddFromGameDetailButton igdbId={1234} gameTitle="Hollow Knight" />
      );
      await actions.click();
    });

    it("invokes the addGameToLibraryFn server fn with the IGDB id", () => {
      expect(addGameToLibraryFn).toHaveBeenCalledWith({
        data: { igdbId: 1234 },
      });
    });

    it("fires the success toast", () => {
      expect(toast.success).toHaveBeenCalledWith("Added to library");
    });
  });

  describe("given the mutation rejects", () => {
    beforeEach(async () => {
      vi.mocked(addGameToLibraryFn).mockRejectedValueOnce(new Error("boom"));
      render(
        <AddFromGameDetailButton igdbId={1234} gameTitle="Hollow Knight" />
      );
      await actions.click();
    });

    it("renders the inline error alert with the rejection message", () => {
      expect(elements.queryAlert()?.textContent).toBe("boom");
    });

    it("fires the error toast with the rejection message", () => {
      expect(toast.error).toHaveBeenCalledWith("boom");
    });
  });
});
