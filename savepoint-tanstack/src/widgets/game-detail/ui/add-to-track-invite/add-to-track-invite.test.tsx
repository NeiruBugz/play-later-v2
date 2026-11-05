import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddToTrackInvite } from "./add-to-track-invite";

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
  Link: ({ to, children, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/add-game/api/search-games-fn", () => ({
  searchGamesFn: vi.fn(),
}));

const { addGameFnMock } = vi.hoisted(() => ({ addGameFnMock: vi.fn() }));

vi.mock("@/features/add-game/api/add-game-fn", () => ({
  addGameFn: addGameFnMock,
}));

vi.mock("@/features/add-game/api/undo-add-game-fn", () => ({
  undoAddGameFn: vi.fn(),
}));

const elements = {
  getRegion: () => screen.getByTestId("add-to-track-invite"),
  queryAddButton: () =>
    screen.queryByRole("button", { name: "Add to library" }),
  querySignInLink: () => screen.queryByRole("link", { name: "Sign in" }),
  queryInvitationCopy: () =>
    screen.queryByRole("heading", { name: "Add Hollow Knight" }),
};

describe("AddToTrackInvite", () => {
  describe("given a signed-in viewer (not in library)", () => {
    beforeEach(() => {
      render(
        <AddToTrackInvite igdbId={1234} gameTitle="Hollow Knight" isSignedIn />
      );
    });

    it("renders an invitation to add the game", () => {
      expect(elements.getRegion()).toBeDefined();
      expect(elements.queryInvitationCopy()).not.toBeNull();
    });

    it("offers an Add to library action and no sign-in link", () => {
      expect(elements.queryAddButton()).not.toBeNull();
      expect(elements.querySignInLink()).toBeNull();
    });
  });

  describe("given the signed-in viewer taps Add to library", () => {
    beforeEach(async () => {
      addGameFnMock.mockResolvedValue({
        libraryItemId: 5,
        created: true,
        status: "WANT",
        upNextPosition: null,
      });
      render(
        <>
          <AddToTrackInvite
            igdbId={1234}
            gameTitle="Hollow Knight"
            isSignedIn
          />
          <Toaster />
        </>
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Add to library" })
      );
    });

    it("adds as Want in one tap and confirms with Undo", async () => {
      expect(addGameFnMock).toHaveBeenCalledWith({ data: { igdbId: 1234 } });
      expect(
        await screen.findByText("Added Hollow Knight to Want")
      ).toBeDefined();
      expect(await screen.findByRole("button", { name: "Undo" })).toBeDefined();
    });
  });

  describe("given a logged-out viewer", () => {
    beforeEach(() => {
      render(
        <AddToTrackInvite
          igdbId={1234}
          gameTitle="Hollow Knight"
          isSignedIn={false}
        />
      );
    });

    it("renders an invitation to add the game", () => {
      expect(elements.getRegion()).toBeDefined();
      expect(elements.queryInvitationCopy()).not.toBeNull();
    });

    it("offers a sign-in link and no add-to-library action", () => {
      expect(elements.querySignInLink()).not.toBeNull();
      expect(elements.queryAddButton()).toBeNull();
    });
  });
});
