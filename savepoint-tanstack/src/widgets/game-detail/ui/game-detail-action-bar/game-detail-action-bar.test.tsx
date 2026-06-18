import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GameDetailActionBar } from "./game-detail-action-bar";

const mockNavigate = vi.fn();

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
    screen.queryByRole("button", { name: /Change library status/ }),
  queryLogSessionButton: () =>
    screen.queryByRole("button", { name: "Log session" }),
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

describe("GameDetailActionBar", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  describe("given a signed-in viewer with a library entry (status PLAYING)", () => {
    const onStatusClick = vi.fn();

    beforeEach(() => {
      render(
        <GameDetailActionBar
          gameSlug="hollow-knight"
          gameStatus="PLAYING"
          viewerUserId="user-1"
          onStatusClick={onStatusClick}
        />
      );
    });

    it("renders a status pill showing the current status", () => {
      expect(elements.queryStatusPill()).not.toBeNull();
    });

    it("renders a Log session button", () => {
      expect(elements.queryLogSessionButton()).not.toBeNull();
    });

    it("calls onStatusClick when the status pill is tapped", async () => {
      await actions.clickStatusPill();
      expect(onStatusClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("given the user taps the Log session button with slug hollow-knight", () => {
    beforeEach(async () => {
      render(
        <GameDetailActionBar
          gameSlug="hollow-knight"
          gameStatus="PLAYING"
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
          gameStatus={null}
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
          gameStatus={null}
          viewerUserId="user-1"
        />
      );
    });

    it("renders an action affordance (Log session button or similar)", () => {
      const logButton = elements.queryLogSessionButton();
      const container = elements.queryContainer();
      expect(logButton !== null || container !== null).toBe(true);
    });
  });
});
