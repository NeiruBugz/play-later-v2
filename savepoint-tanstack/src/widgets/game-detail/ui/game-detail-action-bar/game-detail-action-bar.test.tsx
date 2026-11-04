import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GameDetailActionBar } from "./game-detail-action-bar";

const mockNavigate = vi.fn();

vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: vi.fn(() => false),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

const elements = {
  queryStatusPill: () =>
    screen.queryByRole("button", { name: /^Status: .*\. Change$/ }),
  queryStatusRadios: () => screen.queryAllByRole("radio"),
  queryLogSessionButton: () =>
    screen.queryByRole("button", { name: "Log time" }),
  queryContainer: () => screen.queryByTestId("game-detail-action-bar"),
};

const actions = {
  clickLogSession: async () => {
    await userEvent.click(elements.queryLogSessionButton()!);
  },
  clickStatusPill: async () => {
    await userEvent.click(elements.queryStatusPill()!);
  },
};

const playingState = {
  status: "PLAYING" as const,
  setStatus: vi.fn(),
  isPending: false,
};

describe("GameDetailActionBar", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  describe("given a signed-in viewer with a library entry (status PLAYING)", () => {
    const scrollIntoView = vi.fn();
    const scrollTo = vi.fn();

    beforeEach(() => {
      scrollIntoView.mockReset();
      scrollTo.mockReset();
      Element.prototype.scrollIntoView = scrollIntoView;
      vi.stubGlobal("scrollTo", scrollTo);
      playingState.setStatus.mockReset();
      render(
        <GameDetailActionBar
          gameSlug="hollow-knight"
          libraryStatus={playingState}
          viewerUserId="user-1"
        />
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("renders a status pill showing the current status", () => {
      expect(elements.queryStatusPill()).not.toBeNull();
    });

    it("renders a Log time button", () => {
      expect(elements.queryLogSessionButton()).not.toBeNull();
    });

    it("opens the picker without scrolling when the status pill is tapped", async () => {
      await actions.clickStatusPill();
      expect(elements.queryStatusRadios()).toHaveLength(3);
      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it("reports the picked status", async () => {
      await actions.clickStatusPill();
      await userEvent.click(screen.getByRole("radio", { name: "Done" }));
      expect(playingState.setStatus).toHaveBeenCalledWith("DONE");
    });
  });

  describe("given the user taps the Log time button with slug hollow-knight", () => {
    beforeEach(async () => {
      render(
        <GameDetailActionBar
          gameSlug="hollow-knight"
          libraryStatus={playingState}
          viewerUserId="user-1"
        />
      );
      await actions.clickLogSession();
    });

    it("calls navigate with action log-session and the game slug", () => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe("given a signed-out viewer (viewerUserId null)", () => {
    beforeEach(() => {
      render(
        <GameDetailActionBar
          gameSlug="hollow-knight"
          libraryStatus={null}
          viewerUserId={null}
        />
      );
    });

    it("renders nothing", () => {
      expect(elements.queryContainer()).toBeNull();
      expect(elements.queryLogSessionButton()).toBeNull();
    });
  });

  describe("given a signed-in viewer with no library entry (status null)", () => {
    beforeEach(() => {
      render(
        <GameDetailActionBar
          gameSlug="hollow-knight"
          libraryStatus={null}
          viewerUserId="user-1"
        />
      );
    });

    it("shows no Log time button", () => {
      expect(elements.queryLogSessionButton()).toBeNull();
      expect(elements.queryContainer()).toBeNull();
    });
  });
});
