import { render, screen } from "@testing-library/react";
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

vi.mock("@/features/add-game/api/add-game-to-library-fn", () => ({
  addGameToLibraryFn: vi.fn(),
}));

const elements = {
  getRegion: () => screen.getByTestId("add-to-track-invite"),
  queryAddButton: () =>
    screen.queryByRole("button", { name: /Add .* to library/ }),
  querySignInLink: () => screen.queryByRole("link", { name: "Sign in" }),
  queryInvitationCopy: () => screen.queryByText(/start tracking/i),
};

describe("AddToTrackInvite", () => {
  describe("given a signed-in viewer (not in library)", () => {
    beforeEach(() => {
      render(
        <AddToTrackInvite igdbId={1234} gameTitle="Hollow Knight" isSignedIn />
      );
    });

    it("renders an invitation to start tracking", () => {
      expect(elements.getRegion()).toBeDefined();
      expect(elements.queryInvitationCopy()).not.toBeNull();
    });

    it("offers an Add to library action and no sign-in link", () => {
      expect(elements.queryAddButton()).not.toBeNull();
      expect(elements.querySignInLink()).toBeNull();
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

    it("renders an invitation to start tracking", () => {
      expect(elements.getRegion()).toBeDefined();
      expect(elements.queryInvitationCopy()).not.toBeNull();
    });

    it("offers a sign-in link and no add-to-library action", () => {
      expect(elements.querySignInLink()).not.toBeNull();
      expect(elements.queryAddButton()).toBeNull();
    });
  });
});
